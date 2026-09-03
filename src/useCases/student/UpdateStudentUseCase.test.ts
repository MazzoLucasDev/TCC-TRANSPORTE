import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateStudentUseCase } from "./UpdateStudentUseCase";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository";
import { Student } from "../../domain/entities/student/Student";

describe("UpdateStudentUseCase", () => {
  let studentRepository: IStudentRepository;
  let sut: UpdateStudentUseCase;
  let student: Student;

  const STUDENT_USER_ID = "user-1";

  const validInput = {
    studentId: "",
    requesterId: STUDENT_USER_ID,
    dateOfBirth: "2010-03-20",
    collectionPoint: { lat: -25.43, long: -49.28 },
  };

  beforeEach(() => {
    const result = Student.create({
      userId: STUDENT_USER_ID,
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    student = result.value;
    validInput.studentId = student.id;

    studentRepository = {
      findById: vi.fn().mockResolvedValue(student),
      findByUserId: vi.fn(),
      listByVanId: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    sut = UpdateStudentUseCase.create(studentRepository);
  });

  it("deve atualizar o aluno com sucesso quando o requester é o próprio aluno", async () => {
    const result = await sut.execute(validInput);

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.collectionPoint).toEqual({
        lat: -25.43,
        long: -49.28,
      });
    }
    expect(studentRepository.update).toHaveBeenCalledOnce();
  });

  it("deve rejeitar quando o requester não é o próprio aluno", async () => {
    const result = await sut.execute({
      ...validInput,
      requesterId: "outro-user",
    });

    expect(result.isLeft()).toBe(true);
    expect(studentRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando o aluno não existe", async () => {
    studentRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute(validInput);

    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar ponto de coleta inválido", async () => {
    const result = await sut.execute({
      ...validInput,
      collectionPoint: { lat: 999, long: -49.27 },
    });

    expect(result.isLeft()).toBe(true);
    expect(studentRepository.update).not.toHaveBeenCalled();
  });

  it("não deve alterar o vanId do aluno", async () => {
    const linked = student.linkToVan("van-1");
    studentRepository.findById = vi.fn().mockResolvedValue(linked);

    await sut.execute({ ...validInput, studentId: linked.id });

    const updatedStudentPassed = (studentRepository.update as any).mock
      .calls[0][0];
    expect(updatedStudentPassed.vanId).toBe("van-1");
  });
});
