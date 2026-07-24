import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListConfirmedAttendanceUseCase } from "./ListConfirmedAttendanceUseCase.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import { Student } from "../../domain/entities/student/Student.js";
import { Attendance } from "../../domain/entities/attendance/Attendance.js";

describe("ListConfirmedAttendanceUseCase", () => {
  let studentRepository: IStudentRepository;
  let attendanceRepository: IAttendanceRepository;
  let sut: ListConfirmedAttendanceUseCase;
  let student1: Student;
  let student2: Student;
  let student3: Student;

  const buildStudent = () => {
    const result = Student.create({
      userId: "user-x",
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    return result.value;
  };

  beforeEach(() => {
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

    sut = ListConfirmedAttendanceUseCase.create(
      studentRepository,
      attendanceRepository,
    );
  });

  it("deve retornar todos os alunos da van quando ninguém marcou ausência", async () => {
    const result = await sut.execute({ vanId: "van-1", date: "2026-07-20" });

    expect(result.confirmedStudents).toHaveLength(3);
  });

  it("deve excluir os alunos que marcaram ausência", async () => {
    const absenceResult = Attendance.create({
      studentId: student2.id,
      date: "2026-07-20",
      status: "ABSENT",
    });
    if (absenceResult.isLeft()) throw new Error("Falha ao montar fixture");

    attendanceRepository.listByVanAndDate = vi
      .fn()
      .mockResolvedValue([absenceResult.value]);

    const result = await sut.execute({ vanId: "van-1", date: "2026-07-20" });

    expect(result.confirmedStudents).toHaveLength(2);
    expect(
      result.confirmedStudents.find((s) => s.studentId === student2.id),
    ).toBeUndefined();
  });

  it("deve retornar lista vazia quando todos marcaram ausência", async () => {
    const buildAbsence = (studentId: string) => {
      const r = Attendance.create({
        studentId,
        date: "2026-07-20",
        status: "ABSENT",
      });
      if (r.isLeft()) throw new Error("Falha ao montar fixture");
      return r.value;
    };

    attendanceRepository.listByVanAndDate = vi
      .fn()
      .mockResolvedValue([
        buildAbsence(student1.id),
        buildAbsence(student2.id),
        buildAbsence(student3.id),
      ]);

    const result = await sut.execute({ vanId: "van-1", date: "2026-07-20" });

    expect(result.confirmedStudents).toEqual([]);
  });

  it("não deve excluir alunos com status PRESENT explícito", async () => {
    const presentResult = Attendance.create({
      studentId: student1.id,
      date: "2026-07-20",
      status: "PRESENT",
    });
    if (presentResult.isLeft()) throw new Error("Falha ao montar fixture");

    attendanceRepository.listByVanAndDate = vi
      .fn()
      .mockResolvedValue([presentResult.value]);

    const result = await sut.execute({ vanId: "van-1", date: "2026-07-20" });

    expect(result.confirmedStudents).toHaveLength(3);
  });
});
