import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegisterAbsenceUseCase } from "./RegisterAbsenceUseCase.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import { Student } from "../../domain/entities/student/Student.js";
import { Attendance } from "../../domain/entities/attendance/Attendance.js";

describe("RegisterAbsenceUseCase", () => {
  let attendanceRepository: IAttendanceRepository;
  let studentRepository: IStudentRepository;
  let sut: RegisterAbsenceUseCase;
  let student: Student;

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
      findByStudentAndDate: vi.fn().mockResolvedValue(null), // por padrão, não existe ainda
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

    sut = RegisterAbsenceUseCase.create(
      attendanceRepository,
      studentRepository,
    );
  });

  it("deve criar um novo registro de ausência quando não existe nenhum", async () => {
    const result = await sut.execute({
      studentId: student.id,
      date: "2026-07-20",
    });

    expect(result.isRight()).toBe(true);
    expect(attendanceRepository.create).toHaveBeenCalledOnce();
    expect(attendanceRepository.update).not.toHaveBeenCalled();
    if (result.isRight()) {
      expect(result.value.status).toBe("ABSENT");
    }
  });

  it("deve atualizar o registro existente em vez de criar um novo", async () => {
    const existingResult = Attendance.create({
      studentId: student.id,
      date: "2026-07-20",
      status: "PRESENT",
    });
    if (existingResult.isLeft()) throw new Error("Falha ao montar fixture");

    attendanceRepository.findByStudentAndDate = vi
      .fn()
      .mockResolvedValue(existingResult.value);

    const result = await sut.execute({
      studentId: student.id,
      date: "2026-07-20",
    });

    expect(result.isRight()).toBe(true);
    expect(attendanceRepository.update).toHaveBeenCalledOnce();
    expect(attendanceRepository.create).not.toHaveBeenCalled();
    if (result.isRight()) {
      expect(result.value.status).toBe("ABSENT");
    }
  });

  it("deve rejeitar quando o aluno não existe", async () => {
    studentRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      studentId: "inexistente",
      date: "2026-07-20",
    });

    expect(result.isLeft()).toBe(true);
    expect(attendanceRepository.create).not.toHaveBeenCalled();
  });

  it("deve rejeitar data inválida", async () => {
    const result = await sut.execute({
      studentId: student.id,
      date: "data-invalida",
    });

    expect(result.isLeft()).toBe(true);
  });
});
