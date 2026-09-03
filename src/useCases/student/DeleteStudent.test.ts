import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteStudentUseCase } from "./DeleteStudentUseCase";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository";
import { Student } from "../../domain/entities/student/Student";

describe("DeleteStudentUseCase", () => {
  let studentRepository: IStudentRepository;
  let sut: DeleteStudentUseCase;
  let student: Student;

  const STUDENT_USER_ID = "user-1";

  beforeEach(() => {
    const result = Student.create({
      userId: STUDENT_USER_ID,
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    student = result.value;

    studentRepository = {
      findById: vi.fn().mockResolvedValue(student),
      findByUserId: vi.fn(),
      listByVanId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    sut = DeleteStudentUseCase.create(studentRepository);
  });

  it("deve deletar o aluno quando o requester é o próprio aluno", async () => {
    const result = await sut.execute({
      studentId: student.id,
      requesterId: STUDENT_USER_ID,
    });

    expect(result.isRight()).toBe(true);
    expect(studentRepository.delete).toHaveBeenCalledWith(student.id);
  });

  it("deve rejeitar quando o requester não é o próprio aluno", async () => {
    const result = await sut.execute({
      studentId: student.id,
      requesterId: "outro-user",
    });

    expect(result.isLeft()).toBe(true);
    expect(studentRepository.delete).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando o aluno não existe", async () => {
    studentRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      studentId: "inexistente",
      requesterId: STUDENT_USER_ID,
    });

    expect(result.isLeft()).toBe(true);
    expect(studentRepository.delete).not.toHaveBeenCalled();
  });
});
