import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegisterPresenceUseCase } from "./RegisterPresenceUseCase.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import { Student } from "../../domain/entities/student/Student.js";
import { Attendance } from "../../domain/entities/attendance/Attendance.js";
import { InvalidAttendanceDateError } from "../../domain/entities/attendance/errors/InvalidAttendanceError.js";
import { NotStudentOwnerError } from "../shared/NotStudentOwnerError.js";
import { StudentNotFoundError } from "./errors/StudentNotFoundError.js";

describe("RegisterPresenceUseCase", () => {
  let attendanceRepository: IAttendanceRepository;
  let studentRepository: IStudentRepository;
  let sut: RegisterPresenceUseCase;
  let student: Student;

  const DATE = "2026-07-20";

  const buildAttendance = (status: "PRESENT" | "ABSENT") => {
    const r = Attendance.create({ studentId: student.id, date: DATE, status });
    if (r.isLeft()) throw new Error("Falha ao montar fixture");
    return r.value;
  };

  beforeEach(() => {
    const studentResult = Student.create({
      userId: "user-1",
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (studentResult.isLeft()) throw new Error("Falha ao montar fixture");
    student = studentResult.value;

    attendanceRepository = {
      findById: vi.fn(),
      findByStudentAndDate: vi.fn().mockResolvedValue(null),
      listByVanAndDate: vi.fn(),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    studentRepository = {
      findById: vi.fn().mockResolvedValue(student),
      findByUserId: vi.fn(),
      listByVanId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    sut = RegisterPresenceUseCase.create(attendanceRepository, studentRepository);
  });

  it("deve desfazer a ausência existente, marcando o aluno como presente", async () => {
    attendanceRepository.findByStudentAndDate = vi
      .fn()
      .mockResolvedValue(buildAttendance("ABSENT"));

    const result = await sut.execute({
      studentId: student.id,
      requesterId: "user-1",
      date: DATE,
    });

    expect(result.isRight()).toBe(true);
    expect(attendanceRepository.update).toHaveBeenCalledOnce();
    const updated = vi.mocked(attendanceRepository.update).mock.calls[0]?.[0];
    expect(updated?.status).toBe("PRESENT");
    if (result.isRight()) {
      expect(result.value.status).toBe("PRESENT");
      expect(result.value.studentId).toBe(student.id);
    }
  });

  it("não deve gravar nada quando já não existe ausência no dia", async () => {
    const result = await sut.execute({
      studentId: student.id,
      requesterId: "user-1",
      date: DATE,
    });

    expect(result.isRight()).toBe(true);
    expect(attendanceRepository.create).not.toHaveBeenCalled();
    expect(attendanceRepository.update).not.toHaveBeenCalled();
  });

  it("não deve atualizar quando o registro do dia já é de presença", async () => {
    attendanceRepository.findByStudentAndDate = vi
      .fn()
      .mockResolvedValue(buildAttendance("PRESENT"));

    const result = await sut.execute({
      studentId: student.id,
      requesterId: "user-1",
      date: DATE,
    });

    expect(result.isRight()).toBe(true);
    expect(attendanceRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando o aluno não existe", async () => {
    studentRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      studentId: "inexistente",
      requesterId: "user-1",
      date: DATE,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(StudentNotFoundError);
    }
  });

  it("deve rejeitar quando quem pede não é o dono do aluno", async () => {
    const result = await sut.execute({
      studentId: student.id,
      requesterId: "outro-usuario",
      date: DATE,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotStudentOwnerError);
    }
    expect(attendanceRepository.findByStudentAndDate).not.toHaveBeenCalled();
    expect(attendanceRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar data inválida", async () => {
    const result = await sut.execute({
      studentId: student.id,
      requesterId: "user-1",
      date: "data-invalida",
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidAttendanceDateError);
    }
  });
});
