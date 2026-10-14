// src/useCases/student/ListVanStudentUseCase.test.ts (substitui o anterior)
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListVanStudentUseCase } from "./ListVanStudentUseCase";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository";
import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import { Student } from "../../domain/entities/student/Student";
import { User } from "../../domain/entities/user/User";

describe("ListVanStudentUseCase", () => {
  let studentRepository: IStudentRepository;
  let userRepository: IUserRepository;
  let sut: ListVanStudentUseCase;
  let student1: Student;
  let users: Record<string, User>;

  const buildStudent = (userId: string) => {
    const result = Student.create({
      userId,
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    return result.value;
  };

  const buildUser = (id: string, name: string, phone: string) =>
    User.reconstitute({
      id,
      name,
      email: `${id}@email.com`,
      hashedPassword: "hashed-123",
      phone,
      userType: "ALUNO",
    });

  beforeEach(() => {
    student1 = buildStudent("user-1");
    const student2 = buildStudent("user-2");

    users = {
      "user-1": buildUser("user-1", "Ana Aluna", "41999999999"),
      "user-2": buildUser("user-2", "Bruno Aluno", "41988888888"),
    };

    studentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      listByVanId: vi.fn().mockResolvedValue([student1, student2]),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    userRepository = {
      findById: vi
        .fn()
        .mockImplementation(async (id: string) => users[id] ?? null),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    sut = ListVanStudentUseCase.create(studentRepository, userRepository);
  });

  it("deve listar os alunos da van com nome e telefone", async () => {
    const result = await sut.execute({ vanId: "van-1" });

    expect(result.students).toHaveLength(2);
    expect(result.students[0]).toEqual({
      id: student1.id,
      userId: "user-1",
      name: "Ana Aluna",
      phone: "41999999999",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    expect(result.students[1]?.name).toBe("Bruno Aluno");
  });

  it("deve retornar lista vazia quando a van não tem alunos", async () => {
    studentRepository.listByVanId = vi.fn().mockResolvedValue([]);

    const result = await sut.execute({ vanId: "van-vazia" });

    expect(result.students).toEqual([]);
  });

  it("deve chamar o repository com o vanId correto", async () => {
    await sut.execute({ vanId: "van-1" });

    expect(studentRepository.listByVanId).toHaveBeenCalledWith("van-1");
  });
});
