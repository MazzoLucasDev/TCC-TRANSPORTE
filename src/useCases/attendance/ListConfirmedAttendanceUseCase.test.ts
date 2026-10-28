import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListConfirmedAttendanceUseCase } from "./ListConfirmedAttendanceUseCase.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { Student } from "../../domain/entities/student/Student.js";
import { Attendance } from "../../domain/entities/attendance/Attendance.js";
import { Van } from "../../domain/entities/van/Van.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import { NotVanOwnerError } from "../shared/NotVanOwnerError.js";

describe("ListConfirmedAttendanceUseCase", () => {
  let studentRepository: IStudentRepository;
  let attendanceRepository: IAttendanceRepository;
  let vanRepository: IVanRepository;
  let sut: ListConfirmedAttendanceUseCase;
  let van: Van;
  let student1: Student;
  let student2: Student;
  let student3: Student;

  const DRIVER_ID = "driver-1";
  const DATE = "2026-07-20";

  const buildStudent = () => {
    const result = Student.create({
      userId: "user-x",
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    return result.value;
  };

  const buildAbsence = (studentId: string) => {
    const r = Attendance.create({ studentId, date: DATE, status: "ABSENT" });
    if (r.isLeft()) throw new Error("Falha ao montar fixture");
    return r.value;
  };

  beforeEach(() => {
    const vanResult = Van.create({
      model: "Sprinter",
      year: 2022,
      period: "MANHA",
      destiny: "Colégio X",
      capacity: 15,
      driverId: DRIVER_ID,
    });
    if (vanResult.isLeft()) throw new Error("Falha ao montar fixture");
    van = vanResult.value;

    student1 = buildStudent();
    student2 = buildStudent();
    student3 = buildStudent();

    studentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      listByVanId: vi.fn().mockResolvedValue([student1, student2, student3]),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    attendanceRepository = {
      findById: vi.fn(),
      findByStudentAndDate: vi.fn(),
      listByVanAndDate: vi.fn().mockResolvedValue([]), // ninguém marcou ausência por padrão
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

    sut = ListConfirmedAttendanceUseCase.create(
      studentRepository,
      attendanceRepository,
      vanRepository,
    );
  });

  it("deve retornar todos os alunos da van quando ninguém marcou ausência", async () => {
    const result = await sut.execute({
      requesterId: DRIVER_ID,
      vanId: van.id,
      date: DATE,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.confirmedStudents).toHaveLength(3);
    }
  });

  it("deve excluir os alunos que marcaram ausência", async () => {
    attendanceRepository.listByVanAndDate = vi
      .fn()
      .mockResolvedValue([buildAbsence(student2.id)]);

    const result = await sut.execute({
      requesterId: DRIVER_ID,
      vanId: van.id,
      date: DATE,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.confirmedStudents).toHaveLength(2);
      expect(
        result.value.confirmedStudents.find((s) => s.studentId === student2.id),
      ).toBeUndefined();
    }
  });

  it("deve retornar lista vazia quando todos marcaram ausência", async () => {
    attendanceRepository.listByVanAndDate = vi
      .fn()
      .mockResolvedValue([
        buildAbsence(student1.id),
        buildAbsence(student2.id),
        buildAbsence(student3.id),
      ]);

    const result = await sut.execute({
      requesterId: DRIVER_ID,
      vanId: van.id,
      date: DATE,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.confirmedStudents).toEqual([]);
    }
  });

  it("não deve excluir alunos com status PRESENT explícito", async () => {
    const presentResult = Attendance.create({
      studentId: student1.id,
      date: DATE,
      status: "PRESENT",
    });
    if (presentResult.isLeft()) throw new Error("Falha ao montar fixture");

    attendanceRepository.listByVanAndDate = vi
      .fn()
      .mockResolvedValue([presentResult.value]);

    const result = await sut.execute({
      requesterId: DRIVER_ID,
      vanId: van.id,
      date: DATE,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.confirmedStudents).toHaveLength(3);
    }
  });

  it("deve rejeitar quando a van não existe", async () => {
    vanRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      requesterId: DRIVER_ID,
      vanId: "van-inexistente",
      date: DATE,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(VanNotFoundError);
    }
  });

  it("deve rejeitar quem não é o motorista dono da van", async () => {
    const result = await sut.execute({
      requesterId: "outro-motorista",
      vanId: van.id,
      date: DATE,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotVanOwnerError);
    }
  });

  it("não deve consultar alunos nem presenças quando o acesso é negado", async () => {
    await sut.execute({
      requesterId: "outro-motorista",
      vanId: van.id,
      date: DATE,
    });

    expect(studentRepository.listByVanId).not.toHaveBeenCalled();
    expect(attendanceRepository.listByVanAndDate).not.toHaveBeenCalled();
  });

  it("deve rejeitar um aluno que tente listar as presenças da própria van", async () => {
    const result = await sut.execute({
      requesterId: "user-x", // é aluno, não motorista
      vanId: van.id,
      date: DATE,
    });

    expect(result.isLeft()).toBe(true);
  });
});
