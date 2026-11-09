import { describe, it, expect } from "vitest";
import { UserType } from "./UserType.js";
import { InvalidUserTypeError } from "../errors/InvalidUserTypeError.js";

describe("UserType", () => {
  it("deve criar MOTORISTA", () => {
    const result = UserType.create("MOTORISTA");

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.value).toBe("MOTORISTA");
      expect(result.value.isMotorista()).toBe(true);
      expect(result.value.isAluno()).toBe(false);
    }
  });

  it("deve criar ALUNO", () => {
    const result = UserType.create("ALUNO");

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.isAluno()).toBe(true);
      expect(result.value.isMotorista()).toBe(false);
    }
  });

  it("deve aceitar minúsculas e espaços", () => {
    const result = UserType.create("  aluno ");

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.value).toBe("ALUNO");
    }
  });

  it("deve rejeitar tipo desconhecido", () => {
    const result = UserType.create("ADMIN");

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidUserTypeError);
    }
  });

  it("restore não valida o valor", () => {
    expect(UserType.restore("MOTORISTA").isMotorista()).toBe(true);
  });
});
