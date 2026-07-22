import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateVanUseCase } from "./CreateVanUseCase.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { User } from "../../domain/entities/user/User.js";

describe("CreateVanUseCase", () => {
  let vanRepository: IVanRepository;
  let userRepository: IUserRepository;
  let sut: CreateVanUseCase;
  let driverUser: User;
  let studentUser: User;

  const validVanInput = {
    model: "Sprinter",
    year: 2022,
    period: "MANHA",
    destiny: "Colégio X",
    capacity: 15,
    driverId: "driver-user-1",
  };

  beforeEach(() => {
    driverUser = User.reconstitute({
      id: "driver-user-1",
      name: "João Motorista",
      email: "joao@email.com",
      hashedPassword: "hashed-123",
      phone: "41988888888",
      userType: "MOTORISTA",
    });

    studentUser = User.reconstitute({
      id: "student-user-1",
      name: "Ana Aluna",
      email: "ana@email.com",
      hashedPassword: "hashed-123",
      phone: "41999999999",
      userType: "ALUNO",
    });

    vanRepository = {
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn(),
      listAll: vi.fn(),
      listDriverVans: vi.fn(),
      delete: vi.fn(),
    };

    userRepository = {
      findById: vi.fn().mockResolvedValue(driverUser),
      existsByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    sut = CreateVanUseCase.create(vanRepository, userRepository);
  });

  it("deve criar uma van com sucesso quando o driverId pertence a um motorista", async () => {
    const result = await sut.execute(validVanInput);

    expect(result.isRight()).toBe(true);
    expect(vanRepository.create).toHaveBeenCalledOnce();
  });

  it("deve rejeitar quando o driverId não existe", async () => {
    userRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute(validVanInput);

    expect(result.isLeft()).toBe(true);
    expect(vanRepository.create).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando o usuário existe mas não é motorista", async () => {
    userRepository.findById = vi.fn().mockResolvedValue(studentUser);

    const result = await sut.execute(validVanInput);

    expect(result.isLeft()).toBe(true);
    expect(vanRepository.create).not.toHaveBeenCalled();
  });

  it("deve rejeitar dados de van inválidos (capacidade zero)", async () => {
    const result = await sut.execute({ ...validVanInput, capacity: 0 });

    expect(result.isLeft()).toBe(true);
    expect(vanRepository.create).not.toHaveBeenCalled();
  });
});
