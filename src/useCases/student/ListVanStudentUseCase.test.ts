// src/useCases/student/ListVanStudentUseCase.test.ts (substitui o anterior)
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListVanStudentUseCase } from "./ListVanStudentUseCase";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository";
import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import type { IVanRepository } from "../../domain/repositories/IVanRepository";
import { Student } from "../../domain/entities/student/Student";
import { User } from "../../domain/entities/user/User";
import { Van } from "../../domain/entities/van/Van";
import { NotVanMemberError } from "../shared/NotVanMemberError";
import { VanNotFoundError } from "../shared/VanNotFoundError";

describe("ListVanStudentUseCase", () => {
  let studentRepository: IStudentRepository;
  let userRepository: IUserRepository;
  let vanRepository: IVanRepository;
  let sut: ListVanStudentUseCase;
  let van: Van;
  let student1: Student;
  let users: Record<string, User>;

  const DRIVER_ID = "driver-1";

  const buildStudent = (userId: string) => {
    const result = Student.create({
      userId,
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    return result.value;
  };

  const buildVan = () => {
    const result = Van.create({
      model: "Sprinter",
      year: 2022,
      period: "MANHA",
      destiny: "Colégio X",
      capacity: 15,
      driverId: DRIVER_ID,
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
    van = buildVan();
    student1 = buildStudent("user-1");
    const student2 = buildStudent("user-2");

    users = {
      "user-1": buildUser("user-1", "Ana Aluna", "41999999999"),
      "user-2": buildUser("user-2", "Bruno Aluno", "41988888888"),
    };

    studentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn().mockResolvedValue(null),
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

    vanRepository = {
      findById: vi.fn().mockResolvedValue(van),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      listDriverVans: vi.fn(),
      delete: vi.fn(),
    };

    sut = ListVanStudentUseCase.create(
      studentRepository,
      userRepository,
      vanRepository,
    );
  });

  it("deve listar os alunos da van com nome e telefone para o motorista dono", async () => {
    const result = await sut.execute({
      requesterId: DRIVER_ID,
      vanId: van.id,
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) return;

    expect(result.value.students).toHaveLength(2);
    expect(result.value.students[0]).toEqual({
      id: student1.id,
      userId: "user-1",
      name: "Ana Aluna",
      phone: "41999999999",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    expect(result.value.students[1]?.name).toBe("Bruno Aluno");
  });

  it("deve permitir a listagem para um aluno vinculado à mesma van", async () => {
    studentRepository.findByUserId = vi
      .fn()
      .mockResolvedValue(student1.linkToVan(van.id));

    const result = await sut.execute({
      requesterId: "user-1",
      vanId: van.id,
    });

    expect(result.isRight()).toBe(true);
    expect(studentRepository.findByUserId).toHaveBeenCalledWith("user-1");
    expect(studentRepository.listByVanId).toHaveBeenCalledWith(van.id);
  });

  it("não deve consultar o aluno quando o solicitante é o motorista dono", async () => {
    await sut.execute({ requesterId: DRIVER_ID, vanId: van.id });

    expect(studentRepository.findByUserId).not.toHaveBeenCalled();
  });

  it("deve retornar lista vazia quando a van não tem alunos", async () => {
    studentRepository.listByVanId = vi.fn().mockResolvedValue([]);

    const result = await sut.execute({
      requesterId: DRIVER_ID,
      vanId: van.id,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.students).toEqual([]);
    }
  });

  it("deve rejeitar quando a van não existe", async () => {
    vanRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      requesterId: DRIVER_ID,
      vanId: "van-inexistente",
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(VanNotFoundError);
    }
    expect(studentRepository.listByVanId).not.toHaveBeenCalled();
  });

  it("deve rejeitar um motorista que não é o dono da van", async () => {
    const result = await sut.execute({
      requesterId: "outro-motorista",
      vanId: van.id,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotVanMemberError);
    }
    expect(studentRepository.listByVanId).not.toHaveBeenCalled();
  });

  it("deve rejeitar um aluno vinculado a outra van", async () => {
    studentRepository.findByUserId = vi
      .fn()
      .mockResolvedValue(student1.linkToVan("outra-van"));

    const result = await sut.execute({
      requesterId: "user-1",
      vanId: van.id,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotVanMemberError);
    }
    expect(studentRepository.listByVanId).not.toHaveBeenCalled();
  });

  it("deve rejeitar um aluno sem van", async () => {
    studentRepository.findByUserId = vi.fn().mockResolvedValue(student1);

    const result = await sut.execute({
      requesterId: "user-1",
      vanId: van.id,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotVanMemberError);
    }
  });

  it("não deve expor dados de usuários quando o acesso é negado", async () => {
    await sut.execute({ requesterId: "estranho", vanId: van.id });

    expect(userRepository.findById).not.toHaveBeenCalled();
  });
});
