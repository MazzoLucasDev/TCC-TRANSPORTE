import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateUserUseCase } from "./CreateUserUseCase.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { IDriverRepository } from "../../domain/repositories/IDriverRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IPasswordHasher } from "../../domain/services/IPasswordHasher.js";

describe("CreateUserUseCase", () => {
  let userRepository: IUserRepository;
  let driverRepository: IDriverRepository;
  let studentRepository: IStudentRepository;
  let passwordHasher: IPasswordHasher;
  let sut: CreateUserUseCase; // "sut" = system under test, convenção comum

  beforeEach(() => {
    // recria os mocks antes de cada teste, pra um teste não vazar estado pro outro
    userRepository = {
      findById: vi.fn(),
      existsByEmail: vi.fn().mockResolvedValue(null), // por padrão, e-mail não existe
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    driverRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    studentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByVanId: vi.fn(),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    passwordHasher = {
      hash: vi.fn().mockResolvedValue("hashed-password-123"),
      compare: vi.fn(),
    };

    sut = CreateUserUseCase.create(
      userRepository,
      driverRepository,
      studentRepository,
      passwordHasher,
    );
  });

  it("deve criar um aluno com sucesso", async () => {
    const result = await sut.execute({
      name: "Ana Silva",
      email: "ana@email.com",
      password: "Senha123",
      phone: "41999999999",
      userType: "ALUNO",
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });

    expect(result.isRight()).toBe(true);
    expect(userRepository.create).toHaveBeenCalledOnce();
    expect(studentRepository.create).toHaveBeenCalledOnce();
    expect(driverRepository.create).not.toHaveBeenCalled();
  });

  it("deve criar um motorista com sucesso", async () => {
    const result = await sut.execute({
      name: "João Souza",
      email: "joao@email.com",
      password: "Senha123",
      phone: "41988888888",
      userType: "MOTORISTA",
      license: "12345678900",
      dateOfBirth: "1990-05-14",
    });

    expect(result.isRight()).toBe(true);
    expect(userRepository.create).toHaveBeenCalledOnce();
    expect(driverRepository.create).toHaveBeenCalledOnce();
    expect(studentRepository.create).not.toHaveBeenCalled();
  });

  it("deve rejeitar e-mail já cadastrado", async () => {
    userRepository.existsByEmail = vi.fn().mockResolvedValue({} as any); // simula que já existe

    const result = await sut.execute({
      name: "Ana Silva",
      email: "ana@email.com",
      password: "Senha123",
      phone: "41999999999",
      userType: "ALUNO",
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });

    expect(result.isLeft()).toBe(true);
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("deve rejeitar motorista menor de idade", async () => {
    const dezesseisAnosAtras = new Date();
    dezesseisAnosAtras.setFullYear(dezesseisAnosAtras.getFullYear() - 16);

    const result = await sut.execute({
      name: "João Souza",
      email: "joao@email.com",
      password: "Senha123",
      phone: "41988888888",
      userType: "MOTORISTA",
      license: "12345678900",
      dateOfBirth: dezesseisAnosAtras.toISOString().slice(0, 10),
    });

    expect(result.isLeft()).toBe(true);
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(driverRepository.create).not.toHaveBeenCalled();
  });

  it("deve chamar o hash da senha antes de salvar", async () => {
    await sut.execute({
      name: "Ana Silva",
      email: "ana@email.com",
      password: "Senha123",
      phone: "41999999999",
      userType: "ALUNO",
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith("Senha123");
  });
});
