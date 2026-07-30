import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginUseCase } from "./LoginUseCase.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { IPasswordHasher } from "../../domain/services/IPasswordHasher.js";
import type { ITokenService } from "../../domain/services/ITokenService.js";
import { User } from "../../domain/entities/user/User.js";

describe("LoginUsecase", () => {
  let userRepository: IUserRepository;
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
      userType: "ALUNO",
    });

    userRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(validUser),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn().mockResolvedValue(true), // por padrão, senha bate
    };

    tokenService = {
      generate: vi.fn().mockReturnValue("fake-jwt-token"),
      verify: vi.fn().mockReturnValue("aaaaaaa"),
    };

    sut = LoginUseCase.create(userRepository, passwordHasher, tokenService);
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
        id: expect.any(String),
        name: "Ana Silva",
        userType: "ALUNO",
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
