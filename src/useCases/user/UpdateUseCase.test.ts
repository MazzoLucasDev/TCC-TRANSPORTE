import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateUserUseCase } from "./UpdateUserUseCase.ts";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.ts";
import { User } from "../../domain/entities/user/User.ts";

describe("UpdateUserUseCase", () => {
  let userRepository: IUserRepository;
  let sut: UpdateUserUseCase;
  let existingUser: User;

  beforeEach(() => {
    existingUser = User.reconstitute({
      id: "user-1",
      name: "Ana Antiga",
      email: "ana@email.com",
      hashedPassword: "hashed-123",
      phone: "41999999999",
      userType: "ALUNO",
    });

    userRepository = {
      findById: vi.fn().mockResolvedValue(existingUser),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    sut = UpdateUserUseCase.create(userRepository);
  });

  it("deve atualizar nome e telefone com sucesso", async () => {
    const result = await sut.execute({
      userId: "user-1",
      name: "Ana Nova",
      phone: "41988887777",
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.name).toBe("Ana Nova");
      expect(result.value.phone).toBe("41988887777");
    }
    expect(userRepository.update).toHaveBeenCalledOnce();
  });

  it("não deve alterar e-mail, senha ou tipo de usuário", async () => {
    await sut.execute({
      userId: "user-1",
      name: "Ana Nova",
      phone: "41988887777",
    });

    const updatedUserPassed = (userRepository.update as any).mock.calls[0][0];
    expect(updatedUserPassed.email.value).toBe("ana@email.com");
    expect(updatedUserPassed.userType.value).toBe("ALUNO");
  });

  it("deve rejeitar quando o usuário não existe", async () => {
    userRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      userId: "inexistente",
      name: "Ana Nova",
      phone: "41988887777",
    });

    expect(result.isLeft()).toBe(true);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar nome inválido", async () => {
    const result = await sut.execute({
      userId: "user-1",
      name: "A", // muito curto
      phone: "41988887777",
    });

    expect(result.isLeft()).toBe(true);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar telefone inválido", async () => {
    const result = await sut.execute({
      userId: "user-1",
      name: "Ana Nova",
      phone: "123", // poucos dígitos
    });

    expect(result.isLeft()).toBe(true);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it("não deve alterar o usuário original (imutabilidade)", async () => {
    await sut.execute({
      userId: "user-1",
      name: "Ana Nova",
      phone: "41988887777",
    });

    expect(existingUser.name.value).toBe("Ana Antiga");
  });
});
