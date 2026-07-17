import { Driver } from "./Driver.js";
import { describe, it, expect } from "vitest";

describe("Driver", () => {
  it("deve criar um motorista válido!", () => {
    const result = Driver.create({
      userId: "user-1",
      license: "12345678900",
      dateOfBirth: "1990-05-14",
    });
    expect(result.isRight()).toBe(true);
  });

  it("deve rejeitar UserId vazio!", () => {
    const result = Driver.create({
      userId: "",
      license: "12345678900",
      dateOfBirth: "1990-05-14",
    });
    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar carteira de CNH com formato inválido!", () => {
    const result = Driver.create({
      userId: "user-1",
      license: "1234",
      dateOfBirth: "1990-05-14",
    });
    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar data de nascimento futuro!", () => {
    const result = Driver.create({
      userId: "user-1",
      license: "12345678900",
      dateOfBirth: "2030-05-14",
    });
    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar motorista menor de idade!", () => {
    const dezesseisAnosAtras = new Date();
    dezesseisAnosAtras.setFullYear(dezesseisAnosAtras.getFullYear() - 16);

    const result = Driver.create({
      userId: "user-1",
      license: "12345678900",
      dateOfBirth: dezesseisAnosAtras.toISOString().slice(0, 10),
    });
    expect(result.isLeft()).toBe(true);
  });

  it("deve calcular a idade corretamente!", () => {
    const result = Driver.create({
      userId: "user-1",
      license: "12345678900",
      dateOfBirth: "1990-05-14",
    });
    if (result.isRight()) {
      expect(result.value.getAge()).toBeGreaterThanOrEqual(35);
    }
  });
});
