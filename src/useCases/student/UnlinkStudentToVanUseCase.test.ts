import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnlinkStudentToVanUseCase } from "./UnlinkStudentToVanUseCase";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository";
import type { IVanRepository } from "../../domain/repositories/IVanRepository";
import { Student } from "../../domain/entities/student/Student";
import { Van } from "../../domain/entities/van/Van";

describe("UnlinkStudentToVanUseCase", () => {
  let studentRepository: IStudentRepository;
  let vanRepository: IVanRepository;
  let sut: UnlinkStudentToVanUseCase;
  let linkedStudent: Student;
  let unlinkedStudent: Student;
  let van: Van;

  const DRIVER_ID = "driver-1";

  const buildStudent = () => {
    const result = Student.create({
      userId: "user-1",
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
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
      driverId: DRIVER_ID,
    });
    if (vanResult.isLeft()) throw new Error("Falha ao montar van");
    van = vanResult.value;

    unlinkedStudent = buildStudent();
    linkedStudent = unlinkedStudent.linkToVan(van.id);

    studentRepository = {
      findById: vi.fn().mockResolvedValue(linkedStudent),
      findByUserId: vi.fn(),
      listByVanId: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
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

    sut = UnlinkStudentToVanUseCase.create(studentRepository, vanRepository);
  });

  it("deve desvincular um aluno vinculado com sucesso quando o requester é o dono da van", async () => {
    const result = await sut.execute({
      studentId: linkedStudent.id,
      requesterId: DRIVER_ID,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.vanId).toBeNull();
      expect(result.value.studentId).toBe(linkedStudent.id);
    }
    expect(studentRepository.update).toHaveBeenCalledOnce();
  });

  it("deve rejeitar quando o requester não é o motorista dono da van", async () => {
    const result = await sut.execute({
      studentId: linkedStudent.id,
      requesterId: "outro-motorista-id",
    });

    expect(result.isLeft()).toBe(true);
    expect(studentRepository.update).not.toHaveBeenCalled();
  });

  it("deve salvar o aluno com vanId null após desvincular", async () => {
    await sut.execute({ studentId: linkedStudent.id, requesterId: DRIVER_ID });

    const updatedStudentPassed = (studentRepository.update as any).mock
      .calls[0][0];
    expect(updatedStudentPassed.vanId).toBeNull();
    expect(updatedStudentPassed.isLinkedToVan()).toBe(false);
  });

  it("deve rejeitar quando o aluno não existe", async () => {
    studentRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      studentId: "inexistente",
      requesterId: DRIVER_ID,
    });

    expect(result.isLeft()).toBe(true);
    expect(studentRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando o aluno não está vinculado a nenhuma van", async () => {
    studentRepository.findById = vi.fn().mockResolvedValue(unlinkedStudent);

    const result = await sut.execute({
      studentId: unlinkedStudent.id,
      requesterId: DRIVER_ID,
    });

    expect(result.isLeft()).toBe(true);
    expect(studentRepository.update).not.toHaveBeenCalled();
  });

  it("não deve alterar o aluno original (imutabilidade)", async () => {
    await sut.execute({ studentId: linkedStudent.id, requesterId: DRIVER_ID });

    expect(linkedStudent.vanId).toBe(van.id);
  });
});
