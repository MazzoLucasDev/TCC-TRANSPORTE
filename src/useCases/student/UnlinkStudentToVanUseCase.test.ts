import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnlinkStudentToVanUseCase } from "./UnlinkStudentToVanUseCase";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository";
import { Student } from "../../domain/entities/student/Student";

describe("UnlinkStudentToVanUseCase", () => {
  let studentRepository: IStudentRepository;
  let sut: UnlinkStudentToVanUseCase;
  let linkedStudent: Student;
  let unlinkedStudent: Student;

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
    unlinkedStudent = buildStudent();
    linkedStudent = unlinkedStudent.linkToVan("van-1");

    studentRepository = {
      findById: vi.fn().mockResolvedValue(linkedStudent),
      findByUserId: vi.fn(),
      listByVanId: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    sut = UnlinkStudentToVanUseCase.create(studentRepository);
  });

  it("deve desvincular um aluno vinculado com sucesso", async () => {
    const result = await sut.execute({ studentId: linkedStudent.id });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.vanId).toBeNull();
      expect(result.value.studentId).toBe(linkedStudent.id);
    }
    expect(studentRepository.update).toHaveBeenCalledOnce();
  });

  it("deve salvar o aluno com vanId null após desvincular", async () => {
    await sut.execute({ studentId: linkedStudent.id });

    const updatedStudentPassed = (studentRepository.update as any).mock
      .calls[0][0];
    expect(updatedStudentPassed.vanId).toBeNull();
    expect(updatedStudentPassed.isLinkedToVan()).toBe(false);
  });

  it("deve rejeitar quando o aluno não existe", async () => {
    studentRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({ studentId: "inexistente" });

    expect(result.isLeft()).toBe(true);
    expect(studentRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando o aluno não está vinculado a nenhuma van", async () => {
    studentRepository.findById = vi.fn().mockResolvedValue(unlinkedStudent);

    const result = await sut.execute({ studentId: unlinkedStudent.id });

    expect(result.isLeft()).toBe(true);
    expect(studentRepository.update).not.toHaveBeenCalled();
  });

  it("não deve alterar o aluno original (imutabilidade)", async () => {
    await sut.execute({ studentId: linkedStudent.id });

    expect(linkedStudent.vanId).toBe("van-1"); // a instância original não muda
  });
});
