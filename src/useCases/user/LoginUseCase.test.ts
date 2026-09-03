import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginUseCase } from "./LoginUseCase";
import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import type { IDriverRepository } from "../../domain/repositories/IDriverRepository";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository";
import type { IPasswordHasher } from "../../domain/services/IPasswordHasher";
import type { ITokenService } from "../../domain/services/ITokenService";
import { User } from "../../domain/entities/user/User";
import { Driver } from "../../domain/entities/driver/Driver";

describe("LoginUsecase", () => {
  let userRepository: IUserRepository;
  let driverRepository: IDriverRepository;
  let studentRepository: IStudentRepository;
  let passwordHasher: IPasswordHasher;
  let tokenService: ITokenService;
  let sut: LoginUseCase;
  let validUser: User;

  beforeEach(() => {
    validUser = User.reconstitute({
      id: "user-1",
      name: "Ana Silva",
      email: "ana@email.com",
      hashedPassword: "hashed-password-123",
      phone: "41999999999",
      userType: "MOTORISTA",
    });

    userRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(validUser),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    const driverResult = Driver.create({
      userId: validUser.id,
      license: "12345678900",
      dateOfBirth: "1990-05-14",
    });
    if (driverResult.isLeft())
      throw new Error("Falha ao montar fixture de driver");

    driverRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn().mockResolvedValue(driverResult.value),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    studentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn().mockResolvedValue(null),
      listByVanId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn().mockResolvedValue(true),
    };

    tokenService = {
      generate: vi.fn().mockReturnValue("fake-jwt-token"),
      verify: vi.fn(),
    };

    sut = LoginUseCase.create(
      userRepository,
      driverRepository,
      studentRepository,
      passwordHasher,
      tokenService,
    );
  });

  it("deve logar com sucesso quando credenciais estão corretas", async () => {
    const result = await sut.execute({
      email: "ana@email.com",
      password: "Senha123",
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.token).toBe("fake-jwt-token");
      expect(result.value.user).toEqual({
        id: "user-1",
        name: "Ana Silva",
        userType: "MOTORISTA",
        roleId: expect.any(String),
      });
    }
  });

  it("deve rejeitar quando e-mail não existe", async () => {
    userRepository.findByEmail = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      email: "naoexiste@email.com",
      password: "Senha123",
    });

    expect(result.isLeft()).toBe(true);
    expect(tokenService.generate).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando a senha está incorreta", async () => {
    passwordHasher.compare = vi.fn().mockResolvedValue(false);

    const result = await sut.execute({
      email: "ana@email.com",
      password: "SenhaErrada",
    });

    expect(result.isLeft()).toBe(true);
    expect(tokenService.generate).not.toHaveBeenCalled();
  });

  it("não deve gerar token se e-mail ou senha falharem", async () => {
    userRepository.findByEmail = vi.fn().mockResolvedValue(null);

    await sut.execute({ email: "x@x.com", password: "123" });

    expect(tokenService.generate).not.toHaveBeenCalled();
  });
});
