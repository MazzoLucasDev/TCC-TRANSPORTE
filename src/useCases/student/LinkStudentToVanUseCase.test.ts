import { describe, it, expect, vi, beforeEach } from "vitest";
import { LinkStudentToVanUseCase } from "./LinkStudentToVanUseCase.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import { Van } from "../../domain/entities/van/Van.js";
import { Student } from "../../domain/entities/student/Student.js";

describe("LinkStudentToVanUseCase", () => {
  let vanRepository: IVanRepository;
  let studentRepository: IStudentRepository;
  let sut: LinkStudentToVanUseCase;
  let van: Van;
  let unlinkedStudent: Student;
  let linkedStudent: Student;

  const DRIVER_ID = "driver-1";

  beforeEach(() => {
    const vanResult = Van.create({
      model: "Sprinter",
      year: 2022,
      period: "MANHA",
      destiny: "Colégio X",
      capacity: 2,
      driverId: DRIVER_ID,
    });
    if (vanResult.isLeft()) throw new Error("Falha ao montar van");
    van = vanResult.value;

    const studentResult = Student.create({
      userId: "user-1",
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (studentResult.isLeft()) throw new Error("Falha ao montar student");
    unlinkedStudent = studentResult.value;
    linkedStudent = unlinkedStudent.linkToVan("outra-van-id");

    vanRepository = {
      findById: vi.fn().mockResolvedValue(van),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      listDriverVans: vi.fn(),
      delete: vi.fn(),
    };

    studentRepository = {
      findById: vi.fn().mockResolvedValue(unlinkedStudent),
      findByUserId: vi.fn(),
      listByVanId: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    sut = LinkStudentToVanUseCase.create(vanRepository, studentRepository);
  });

  it("deve vincular aluno à van com sucesso quando o requester é o dono da van", async () => {
    const result = await sut.execute({
      studentId: unlinkedStudent.id,
      vanId: van.id,
      requesterId: DRIVER_ID,
    });

    expect(result.isRight()).toBe(true);
    expect(studentRepository.update).toHaveBeenCalledOnce();
  });

  it("deve rejeitar quando o requester não é o motorista dono da van", async () => {
    const result = await sut.execute({
      studentId: unlinkedStudent.id,
      vanId: van.id,
      requesterId: "outro-motorista-id",
    });

    expect(result.isLeft()).toBe(true);
    expect(studentRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando a van não existe", async () => {
    vanRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      studentId: unlinkedStudent.id,
      vanId: "van-inexistente",
      requesterId: DRIVER_ID,
    });

    expect(result.isLeft()).toBe(true);
    expect(studentRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando o aluno não existe", async () => {
    studentRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      studentId: "student-inexistente",
      vanId: van.id,
      requesterId: DRIVER_ID,
    });

    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar quando o aluno já está vinculado a outra van (RF11)", async () => {
    studentRepository.findById = vi.fn().mockResolvedValue(linkedStudent);

    const result = await sut.execute({
      studentId: linkedStudent.id,
      vanId: van.id,
      requesterId: DRIVER_ID,
    });

    expect(result.isLeft()).toBe(true);
    expect(studentRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando a van está cheia (RF12)", async () => {
    studentRepository.listByVanId = vi
      .fn()
      .mockResolvedValue([unlinkedStudent, unlinkedStudent]);

    const result = await sut.execute({
      studentId: unlinkedStudent.id,
      vanId: van.id,
      requesterId: DRIVER_ID,
    });

    expect(result.isLeft()).toBe(true);
    expect(studentRepository.update).not.toHaveBeenCalled();
  });

  it("deve permitir vincular quando a van tem exatamente 1 vaga restante", async () => {
    studentRepository.listByVanId = vi
      .fn()
      .mockResolvedValue([unlinkedStudent]);

    const result = await sut.execute({
      studentId: unlinkedStudent.id,
      vanId: van.id,
      requesterId: DRIVER_ID,
    });

    expect(result.isRight()).toBe(true);
  });
});
