import { describe, it, expect } from "vitest";
import { User } from "./User.js";

describe("User", () => {
  const validUserData = {
    name: "Ana Silva",
    email: "ana@email.com",
    password: "Senha123",
    phone: "41999999999",
    userType: "ALUNO",
  };

  it("deve criar um usuário válido", () => {
    const result = User.create(validUserData);
    expect(result.isRight()).toBe(true);
  });

  it("deve rejeitar e-mail inválido", () => {
    const result = User.create({ ...validUserData, email: "email-invalido" });
    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar senha curta", () => {
    const result = User.create({ ...validUserData, password: "123" });
    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar tipo de usuário desconhecido", () => {
    const result = User.create({ ...validUserData, userType: "ADMIN" });
    expect(result.isLeft()).toBe(true);
  });

  it("deve normalizar e-mail para minúsculo", () => {
    const result = User.create({ ...validUserData, email: "ANA@EMAIL.COM" });
    if (result.isRight()) {
      expect(result.value.email.value).toBe("ana@email.com");
    }
  });
});
