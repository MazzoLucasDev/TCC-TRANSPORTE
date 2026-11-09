import { describe, it, expect } from "vitest";
import { Password } from "./Password.js";
import { InvalidPasswordError } from "../errors/InvalidPasswordError.js";

describe("Password", () => {
  it("deve criar uma senha válida", () => {
    const result = Password.create("Senha123");

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.value).toBe("Senha123");
    }
  });

  it("deve rejeitar senha com menos de 8 caracteres", () => {
    const result = Password.create("Ab1");

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidPasswordError);
    }
  });

  it("deve rejeitar senha sem número", () => {
    expect(Password.create("SenhaSemNumero").isLeft()).toBe(true);
  });

  it("deve rejeitar senha sem letra minúscula", () => {
    expect(Password.create("SENHA1234").isLeft()).toBe(true);
  });

  it("deve rejeitar senha sem letra maiúscula", () => {
    expect(Password.create("senha1234").isLeft()).toBe(true);
  });

  it("deve rejeitar senha com mais de 32 caracteres", () => {
    expect(Password.create("Senha123".repeat(5)).isLeft()).toBe(true);
  });

  it("validate deve devolver a mensagem do primeiro problema", () => {
    expect(Password.validate("Ab1")).toBe("Deve ter no mínimo 8 caracteres!");
    expect(Password.validate("Senha123")).toBeNull();
  });

  it("restore não valida: aceita o hash já guardado", () => {
    const password = Password.restore("$2b$10$hashqualquer");

    expect(password.value).toBe("$2b$10$hashqualquer");
  });
});
