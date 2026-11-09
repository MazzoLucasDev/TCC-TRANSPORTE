import { describe, it, expect } from "vitest";
import { Model } from "./Model.js";
import { InvalidModelError } from "../errors/InvalidModelError.js";

describe("Model", () => {
  it("deve criar um modelo válido", () => {
    const result = Model.create("Sprinter");

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.value).toBe("Sprinter");
    }
  });

  it("deve remover espaços do início e do fim", () => {
    const result = Model.create("  Master  ");

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.value).toBe("Master");
    }
  });

  it("deve rejeitar modelo vazio", () => {
    const result = Model.create("   ");

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidModelError);
    }
  });

  it("deve rejeitar modelo com menos de 2 caracteres", () => {
    expect(Model.create("a").isLeft()).toBe(true);
  });

  it("deve rejeitar modelo com mais de 100 caracteres", () => {
    expect(Model.create("a".repeat(101)).isLeft()).toBe(true);
  });

  it("deve aceitar os limites de 2 e 100 caracteres", () => {
    expect(Model.create("ab").isRight()).toBe(true);
    expect(Model.create("a".repeat(100)).isRight()).toBe(true);
  });

  it("restore não valida o valor", () => {
    expect(Model.restore("x").value).toBe("x");
  });
});
