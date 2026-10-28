import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetMyStudentProfileUseCase } from "./GetMyStudentProfileUseCase.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { Student } from "../../domain/entities/student/Student.js";
import { User } from "../../domain/entities/user/User.js";
import { Van } from "../../domain/entities/van/Van.js";
import { Attendance } from "../../domain/entities/attendance/Attendance.js";
import { StudentNotFoundError } from "./errors/StudentNotFoundError.js";
import { UserNotFoundError } from "../shared/UserNotFoundError.js";

describe("GetMyStudentProfileUseCase", () => {
  let studentRepository: IStudentRepository;
  let userRepository: IUserRepository;
  let vanRepository: IVanRepository;
  let attendanceRepository: IAttendanceRepository;
  let sut: GetMyStudentProfileUseCase;
  let student: Student;
  let van: Van;
  let users: Record<string, User>;

  const DATE = "2026-07-20";

  const buildUser = (id: string, name: string, phone: string, type: string) =>
    User.reconstitute({
      id,
      name,
      email: `${id}@email.com`,
      hashedPassword: "hashed-123",
      phone,
      userType: type,
    });

  beforeEach(() => {
    const studentResult = Student.create({
      userId: "user-1",
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (studentResult.isLeft()) throw new Error("Falha ao montar fixture");
    student = studentResult.value;

    const vanResult = Van.create({
      model: "Sprinter",
      year: 2022,
      period: "MANHA",
      destiny: "Colégio X",
      capacity: 15,
      driverId: "driver-user",
    });
    if (vanResult.isLeft()) throw new Error("Falha ao montar fixture");
    van = vanResult.value;
    student = student.linkToVan(van.id);

    users = {
      "user-1": buildUser("user-1", "Ana Aluna", "41999999999", "ALUNO"),
      "driver-user": buildUser(
        "driver-user",
        "Carlos Motorista",
        "41977777777",
        "MOTORISTA",
      ),
    };

    studentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn().mockResolvedValue(student),
      listByVanId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    userRepository = {
      findById: vi
        .fn()
        .mockImplementation(async (id: string) => users[id] ?? null),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    vanRepository = {
      findById: vi.fn().mockResolvedValue(van),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      listDriverVans: vi.fn(),
      delete: vi.fn(),
    };

    attendanceRepository = {
      findById: vi.fn(),
      findByStudentAndDate: vi.fn().mockResolvedValue(null),
      listByVanAndDate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    sut = GetMyStudentProfileUseCase.create(
      studentRepository,
      userRepository,
      vanRepository,
      attendanceRepository,
    );
  });

  it("deve devolver os dados do aluno, a van e o contato do motorista", async () => {
    const result = await sut.execute({ requesterId: "user-1", date: DATE });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) return;

    expect(result.value.studentId).toBe(student.id);
    expect(result.value.name).toBe("Ana Aluna");
    expect(result.value.collectionPoint).toEqual({ lat: -25.42, long: -49.27 });
    expect(result.value.van).toEqual({
      id: van.id,
      model: "Sprinter",
      period: "MANHA",
      destiny: "Colégio X",
      emTrajeto: false,
      driver: { name: "Carlos Motorista", phone: "41977777777" },
    });
  });

  it("deve considerar o aluno presente quando não há registro no dia", async () => {
    const result = await sut.execute({ requesterId: "user-1", date: DATE });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.attendance).toEqual({
        date: DATE,
        status: "PRESENT",
      });
    }
  });

  it("deve refletir a ausência registrada no dia", async () => {
    const absence = Attendance.create({
      studentId: student.id,
      date: DATE,
      status: "ABSENT",
    });
    if (absence.isLeft()) throw new Error("Falha ao montar fixture");
    attendanceRepository.findByStudentAndDate = vi
      .fn()
      .mockResolvedValue(absence.value);

    const result = await sut.execute({ requesterId: "user-1", date: DATE });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.attendance.status).toBe("ABSENT");
    }
  });

  it("deve retornar van nula quando o aluno ainda não foi vinculado", async () => {
    const unlinked = Student.create({
      userId: "user-1",
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (unlinked.isLeft()) throw new Error("Falha ao montar fixture");
    studentRepository.findByUserId = vi.fn().mockResolvedValue(unlinked.value);

    const result = await sut.execute({ requesterId: "user-1", date: DATE });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.van).toBeNull();
    }
    expect(vanRepository.findById).not.toHaveBeenCalled();
  });

  it("deve retornar motorista nulo quando o cadastro do motorista não existe mais", async () => {
    delete users["driver-user"];

    const result = await sut.execute({ requesterId: "user-1", date: DATE });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.van?.driver).toBeNull();
    }
  });

  it("deve rejeitar quando o usuário não tem perfil de aluno", async () => {
    studentRepository.findByUserId = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({ requesterId: "user-1", date: DATE });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(StudentNotFoundError);
    }
  });

  it("deve rejeitar quando o cadastro do usuário não existe", async () => {
    delete users["user-1"];

    const result = await sut.execute({ requesterId: "user-1", date: DATE });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError);
    }
  });

  it("deve identificar o aluno pelo requesterId (token), não por outro dado", async () => {
    await sut.execute({ requesterId: "user-1", date: DATE });

    expect(studentRepository.findByUserId).toHaveBeenCalledWith("user-1");
  });
});
