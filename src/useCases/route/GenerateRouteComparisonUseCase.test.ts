import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenerateRouteComparisonUseCase } from "./GenerateRouteComparisonUseCase.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import type { IRouteRepository } from "../../domain/repositories/IRouteRepository.js";
import type {
  GeoPoint,
  IRouteCalculatorService,
  RoutePoint,
} from "../../domain/services/IRouteCalculatorService.js";
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
  let fakeCalculator: IRouteCalculatorService;
  let sut: GenerateRouteComparisonUseCase;
  let van: Van;

  // Pontos reais em Curitiba, com distância crescente a partir da origem,
  // para conseguir prever a ordem esperada do vizinho mais próximo
  const origin = { lat: -25.4284, long: -49.2733 }; // Centro de Curitiba

  // Calculador falso e determinístico, para o teste não depender de infra:
  // as distâncias são euclidianas sobre as coordenadas, o que basta para
  // prever a ordem do vizinho mais próximo. O traçado é a lista de pontos.
  const distanceBetween = (a: GeoPoint, b: GeoPoint) =>
    Math.hypot(a.lat - b.lat, a.long - b.long);

  const buildFakeCalculator = (): IRouteCalculatorService => ({
    getDistanceMatrix: vi.fn(async (from: GeoPoint, points: RoutePoint[]) => {
      const all = [from, ...points];
      return all.map((a) => all.map((b) => distanceBetween(a, b)));
    }),
    calculateRoute: vi.fn(async (from: GeoPoint, points: RoutePoint[]) => {
      const path = [from, ...points.map(({ lat, long }) => ({ lat, long }))];
      let distanceKm = 0;
      for (let i = 1; i < path.length; i++) {
        distanceKm += distanceBetween(path[i - 1]!, path[i]!);
      }
      return {
        distanceKm,
        durationMin: distanceKm * 2,
        geometry: path,
        approximate: true,
      };
    }),
  });

  const buildStudentAt = (lat: number, long: number) => {
    const result = Student.create({
      userId: "user-x",
      dateOfBirth: "2010-03-20",
      coordinates: { lat, long },
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

    fakeCalculator = buildFakeCalculator();

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
      fakeCalculator,
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

  it("deve montar a rota simples com os alunos na ordem de cadastro", async () => {
    const studentFar = buildStudentAt(-25.45, -49.3);
    const studentNear = buildStudentAt(-25.43, -49.275);

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

    expect(fakeCalculator.calculateRoute).toHaveBeenCalledWith(origin, [
      { studentId: studentFar.id, lat: -25.45, long: -49.3 },
      { studentId: studentNear.id, lat: -25.43, long: -49.275 },
    ]);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.simpleRoute.studentOrder).toEqual([
        studentFar.id,
        studentNear.id,
      ]);
    }
  });

  it("deve ordenar a rota otimizada visitando sempre o aluno mais próximo primeiro", async () => {
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

    // as distâncias vêm do calculador, que recebe a origem e os alunos em ordem de cadastro
    expect(fakeCalculator.getDistanceMatrix).toHaveBeenCalledWith(origin, [
      { studentId: studentFar.id, lat: -25.45, long: -49.3 },
      { studentId: studentNear.id, lat: -25.43, long: -49.275 },
    ]);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      // a ordem é decidida pelo caso de uso: o aluno próximo vem antes
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
      // o indicador de aproximação é o informado pelo calculador
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

    const metrics = {
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
      getDistanceMatrix: vi.fn().mockResolvedValue([
        [0, 1],
        [1, 0],
      ]),
      calculateRoute: vi.fn().mockResolvedValue(metrics),
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
    expect(calculator.getDistanceMatrix).toHaveBeenCalledWith(
      origin,
      expectedPoints,
    );
    expect(calculator.calculateRoute).toHaveBeenCalledWith(
      origin,
      expectedPoints,
    );
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.optimizedRoute.geometry).toEqual(metrics.geometry);
      expect(result.value.optimizedRoute.distanceKm).toBe(1.5);
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
