import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenerateRouteComparisonUseCase } from "./GenerateRouteComparisonUseCase.js";
import { HaversineRouteCalculatorService } from "../../infra/services/HaversineRouteCalculatorService.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import type { IRouteRepository } from "../../domain/repositories/IRouteRepository.js";
import type { IRouteCalculatorService } from "../../domain/services/IRouteCalculatorService.js";
import { Van } from "../../domain/entities/van/Van.js";
import { Student } from "../../domain/entities/student/Student.js";
import { NotVanOwnerError } from "../shared/NotVanOwnerError.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/entities/user/User";

describe("GenerateRouteComparisonUseCase", () => {
  let vanRepository: IVanRepository;
  let studentRepository: IStudentRepository;
  let attendanceRepository: IAttendanceRepository;
  let routeRepository: IRouteRepository;
  let userRepository: IUserRepository;
  let sut: GenerateRouteComparisonUseCase;
  let van: Van;

  // Pontos reais em Curitiba, com distância crescente a partir da origem,
  // para conseguir prever a ordem esperada do Nearest Neighbor
  const origin = { lat: -25.4284, long: -49.2733 }; // Centro de Curitiba

  const buildStudentAt = (lat: number, long: number) => {
    const result = Student.create({
      userId: "user-x",
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat, long },
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    return result.value;
  };

  beforeEach(() => {
    const vanResult = Van.create({
      model: "Sprinter",
      year: 2022,
      period: "MANHA",
      destiny: "Colégio X",
      capacity: 15,
      driverId: "driver-1",
    });
    if (vanResult.isLeft()) throw new Error("Falha ao montar van");
    van = vanResult.value;

    vanRepository = {
      findById: vi.fn().mockResolvedValue(van),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      listDriverVans: vi.fn(),
      delete: vi.fn(),
    };

    studentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      listByVanId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    attendanceRepository = {
      findById: vi.fn(),
      findByStudentAndDate: vi.fn(),
      listByVanAndDate: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    routeRepository = {
      findById: vi.fn(),
      listByVanAndDate: vi.fn(),
      create: vi.fn().mockResolvedValue(undefined),
      listAll: vi.fn(),
      delete: vi.fn(),
      deleteByVanId: vi.fn(),
    };

    userRepository = {
      findById: vi.fn().mockResolvedValue(
        User.reconstitute({
          id: "user-x",
          name: "Ana Aluna",
          email: "ana@email.com",
          hashedPassword: "hashed-123",
          phone: "41999999999",
          userType: "ALUNO",
        }),
      ),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    sut = GenerateRouteComparisonUseCase.create(
      vanRepository,
      studentRepository,
      attendanceRepository,
      routeRepository,
      new HaversineRouteCalculatorService(),
      userRepository,
    );
  });

  it("deve rejeitar quando a van não existe", async () => {
    vanRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      requesterId: "driver-1",
      vanId: "van-inexistente",
      date: "2026-07-20",
      driverLocation: origin,
    });

    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar quando não há nenhum aluno confirmado", async () => {
    studentRepository.listByVanId = vi.fn().mockResolvedValue([]);

    const result = await sut.execute({
      requesterId: "driver-1",
      vanId: van.id,
      date: "2026-07-20",
      driverLocation: origin,
    });

    expect(result.isLeft()).toBe(true);
  });

  it("deve gerar a rota simples mantendo a ordem de cadastro", async () => {
    const studentFar = buildStudentAt(-25.45, -49.3); // mais distante
    const studentNear = buildStudentAt(-25.43, -49.275); // mais próximo

    // cadastro na ordem: distante primeiro, próximo depois
    studentRepository.listByVanId = vi
      .fn()
      .mockResolvedValue([studentFar, studentNear]);

    const result = await sut.execute({
      requesterId: "driver-1",
      vanId: van.id,
      date: "2026-07-20",
      driverLocation: origin,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      // rota simples preserva a ordem de entrada, mesmo não sendo a mais eficiente
      expect(result.value.simpleRoute.studentOrder).toEqual([
        studentFar.id,
        studentNear.id,
      ]);
    }
  });

  it("deve gerar a rota otimizada visitando sempre o mais próximo primeiro", async () => {
    const studentFar = buildStudentAt(-25.45, -49.3); // mais distante da origem
    const studentNear = buildStudentAt(-25.43, -49.275); // mais próximo da origem

    // mesma entrada de antes: distante primeiro na lista, próximo depois
    studentRepository.listByVanId = vi
      .fn()
      .mockResolvedValue([studentFar, studentNear]);

    const result = await sut.execute({
      requesterId: "driver-1",
      vanId: van.id,
      date: "2026-07-20",
      driverLocation: origin,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      // rota otimizada corrige a ordem: visita o mais próximo primeiro, mesmo entrando depois na lista
      expect(result.value.optimizedRoute.studentOrder).toEqual([
        studentNear.id,
        studentFar.id,
      ]);
    }
  });

  it("a rota otimizada nunca deve ter distância maior que a rota simples, para a mesma entrada", async () => {
    const s1 = buildStudentAt(-25.45, -49.3);
    const s2 = buildStudentAt(-25.4, -49.25);
    const s3 = buildStudentAt(-25.43, -49.28);

    studentRepository.listByVanId = vi.fn().mockResolvedValue([s1, s2, s3]);

    const result = await sut.execute({
      requesterId: "driver-1",
      vanId: van.id,
      date: "2026-07-20",
      driverLocation: origin,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.optimizedRoute.distanceKm).toBeLessThanOrEqual(
        result.value.simpleRoute.distanceKm,
      );
    }
  });

  it("deve excluir alunos que marcaram ausência do cálculo da rota", async () => {
    const present = buildStudentAt(-25.43, -49.275);
    const absent = buildStudentAt(-25.45, -49.3);

    studentRepository.listByVanId = vi
      .fn()
      .mockResolvedValue([present, absent]);

    const attendanceResult = (
      await import("../../domain/entities/attendance/Attendance.js")
    ).Attendance.create({
      studentId: absent.id,
      date: "2026-07-20",
      status: "ABSENT",
    });
    if (attendanceResult.isLeft()) throw new Error("Falha ao montar fixture");

    attendanceRepository.listByVanAndDate = vi
      .fn()
      .mockResolvedValue([attendanceResult.value]);

    const result = await sut.execute({
      requesterId: "driver-1",
      vanId: van.id,
      date: "2026-07-20",
      driverLocation: origin,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.simpleRoute.studentOrder).toEqual([present.id]);
      expect(result.value.optimizedRoute.studentOrder).toEqual([present.id]);
    }
  });

  it("deve salvar as duas rotas no repositório, com os tipos corretos", async () => {
    const s1 = buildStudentAt(-25.43, -49.275);
    studentRepository.listByVanId = vi.fn().mockResolvedValue([s1]);

    await sut.execute({
      requesterId: "driver-1",
      vanId: van.id,
      date: "2026-07-20",
      driverLocation: origin,
    });

    expect(routeRepository.create).toHaveBeenCalledTimes(2);

    const savedRoutes = (routeRepository.create as any).mock.calls.map(
      (call: any) => call[0],
    );
    const types = savedRoutes.map((route: any) => route.type);

    expect(types).toContain("SIMPLE");
    expect(types).toContain("OPTIMIZED");
  });

  it("deve devolver as paradas com nome e coordenadas, na ordem de cada rota", async () => {
    const studentFar = buildStudentAt(-25.45, -49.3);
    const studentNear = buildStudentAt(-25.43, -49.275);
    studentRepository.listByVanId = vi
      .fn()
      .mockResolvedValue([studentFar, studentNear]);

    const result = await sut.execute({
      requesterId: "driver-1",
      vanId: van.id,
      date: "2026-07-20",
      driverLocation: origin,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.optimizedRoute.stops.map((s) => s.studentId)).toEqual(
        [studentNear.id, studentFar.id],
      );
      expect(result.value.optimizedRoute.stops[0]).toEqual({
        studentId: studentNear.id,
        name: "Ana Aluna",
        lat: -25.43,
        long: -49.275,
      });
    }
  });

  it("deve devolver o traçado e o indicador de aproximação nas duas rotas", async () => {
    const studentFar = buildStudentAt(-25.45, -49.3);
    const studentNear = buildStudentAt(-25.43, -49.275);
    studentRepository.listByVanId = vi
      .fn()
      .mockResolvedValue([studentFar, studentNear]);

    const result = await sut.execute({
      requesterId: "driver-1",
      vanId: van.id,
      date: "2026-07-20",
      driverLocation: origin,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const { simpleRoute, optimizedRoute } = result.value;
      // origem + 2 paradas, na ordem de cada rota
      expect(simpleRoute.geometry).toEqual([
        origin,
        { lat: -25.45, long: -49.3 },
        { lat: -25.43, long: -49.275 },
      ]);
      expect(optimizedRoute.geometry).toEqual([
        origin,
        { lat: -25.43, long: -49.275 },
        { lat: -25.45, long: -49.3 },
      ]);
      // o calculador Haversine só consegue traçar linha reta
      expect(simpleRoute.approximate).toBe(true);
      expect(optimizedRoute.approximate).toBe(true);
    }
  });

  it("deve ignorar no recálculo os alunos já visitados", async () => {
    const studentFar = buildStudentAt(-25.45, -49.3);
    const studentNear = buildStudentAt(-25.43, -49.275);
    studentRepository.listByVanId = vi
      .fn()
      .mockResolvedValue([studentFar, studentNear]);

    const result = await sut.execute({
      requesterId: "driver-1",
      vanId: van.id,
      date: "2026-07-20",
      driverLocation: origin,
      visitedStudentIds: [studentNear.id],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.simpleRoute.studentOrder).toEqual([studentFar.id]);
      expect(result.value.optimizedRoute.studentOrder).toEqual([studentFar.id]);
      expect(result.value.optimizedRoute.geometry).toHaveLength(2);
    }
  });

  it("deve rejeitar o recálculo quando todos os alunos já foram visitados", async () => {
    const student = buildStudentAt(-25.43, -49.275);
    studentRepository.listByVanId = vi.fn().mockResolvedValue([student]);

    const result = await sut.execute({
      requesterId: "driver-1",
      vanId: van.id,
      date: "2026-07-20",
      driverLocation: origin,
      visitedStudentIds: [student.id],
    });

    expect(result.isLeft()).toBe(true);
    expect(routeRepository.create).not.toHaveBeenCalled();
  });

  it("não deve gravar rotas quando persist é false (recálculo automático)", async () => {
    const student = buildStudentAt(-25.43, -49.275);
    studentRepository.listByVanId = vi.fn().mockResolvedValue([student]);

    const result = await sut.execute({
      requesterId: "driver-1",
      vanId: van.id,
      date: "2026-07-20",
      driverLocation: origin,
      persist: false,
    });

    expect(result.isRight()).toBe(true);
    expect(routeRepository.create).not.toHaveBeenCalled();
  });

  it("deve repassar ao calculador só as paradas restantes e devolver o traçado dele sem alterar", async () => {
    const studentFar = buildStudentAt(-25.45, -49.3);
    const studentNear = buildStudentAt(-25.43, -49.275);
    studentRepository.listByVanId = vi
      .fn()
      .mockResolvedValue([studentFar, studentNear]);

    const fake = {
      order: [studentFar.id],
      distanceKm: 1.5,
      durationMin: 4,
      geometry: [
        { lat: -25.4284, long: -49.2733 },
        { lat: -25.44, long: -49.29 },
        { lat: -25.45, long: -49.3 },
      ],
      approximate: false,
    };
    const calculator: IRouteCalculatorService = {
      calculateFixedOrder: vi.fn().mockResolvedValue(fake),
      calculateOptimized: vi.fn().mockResolvedValue(fake),
    };
    sut = GenerateRouteComparisonUseCase.create(
      vanRepository,
      studentRepository,
      attendanceRepository,
      routeRepository,
      calculator,
      userRepository,
    );

    const result = await sut.execute({
      requesterId: "driver-1",
      vanId: van.id,
      date: "2026-07-20",
      driverLocation: origin,
      visitedStudentIds: [studentNear.id],
    });

    const expectedPoints = [
      { studentId: studentFar.id, lat: -25.45, long: -49.3 },
    ];
    expect(calculator.calculateFixedOrder).toHaveBeenCalledWith(
      origin,
      expectedPoints,
    );
    expect(calculator.calculateOptimized).toHaveBeenCalledWith(
      origin,
      expectedPoints,
    );
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.optimizedRoute.geometry).toEqual(fake.geometry);
      expect(result.value.optimizedRoute.approximate).toBe(false);
    }
  });

  it("deve rejeitar quando quem pede não é o motorista dono da van", async () => {
    const result = await sut.execute({
      requesterId: "outro-motorista",
      vanId: van.id,
      date: "2026-07-20",
      driverLocation: origin,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotVanOwnerError);
    }
  });

  it("não deve consultar alunos nem gravar rotas quando o solicitante não é o dono", async () => {
    await sut.execute({
      requesterId: "outro-motorista",
      vanId: van.id,
      date: "2026-07-20",
      driverLocation: origin,
    });

    expect(studentRepository.listByVanId).not.toHaveBeenCalled();
    expect(routeRepository.create).not.toHaveBeenCalled();
  });
});
