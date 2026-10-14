// src/useCases/student/GetStudentSummaryUseCase.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetStudentSummaryUseCase } from "./GetStudentSummaryUseCase";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository";
import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import { Student } from "../../domain/entities/student/Student";
import { User } from "../../domain/entities/user/User";

describe("GetStudentSummaryUseCase", () => {
  let studentRepository: IStudentRepository;
  let userRepository: IUserRepository;
  let sut: GetStudentSummaryUseCase;
  let student: Student;
  let user: User;

  beforeEach(() => {
    const studentResult = Student.create({
      userId: "user-1",
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (studentResult.isLeft()) throw new Error("Falha ao montar fixture");
    student = studentResult.value;

    user = User.reconstitute({
      id: "user-1",
      name: "Ana Aluna",
      email: "ana@email.com",
      hashedPassword: "hashed-123",
      phone: "41999999999",
      userType: "ALUNO",
    });

    studentRepository = {
      findById: vi.fn().mockResolvedValue(student),
      findByUserId: vi.fn(),
      listByVanId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    userRepository = {
      findById: vi.fn().mockResolvedValue(user),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    sut = GetStudentSummaryUseCase.create(studentRepository, userRepository);
  });

  it("deve retornar nome, telefone e se o aluno já está vinculado", async () => {
    const result = await sut.execute({ studentId: student.id });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toEqual({
        studentId: student.id,
        name: "Ana Aluna",
        phone: "41999999999",
        isLinkedToVan: false,
      });
    }
  });

  it("deve indicar quando o aluno já está vinculado a uma van", async () => {
    studentRepository.findById = vi
      .fn()
      .mockResolvedValue(student.linkToVan("van-1"));

    const result = await sut.execute({ studentId: student.id });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.isLinkedToVan).toBe(true);
    }
  });

  it("deve rejeitar quando o aluno não existe", async () => {
    studentRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({ studentId: "inexistente" });

    expect(result.isLeft()).toBe(true);
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando o usuário do aluno não existe", async () => {
    userRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({ studentId: student.id });

    expect(result.isLeft()).toBe(true);
  });
});
