import { describe, it, expect } from "vitest";
import { Destiny } from "./Destiny.js";
import { InvalidDestinyError } from "../errors/InvalidDestinyError.js";

describe("Destiny", () => {
  it("deve criar um destino válido", () => {
    const result = Destiny.create("Colégio Estadual");

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.value).toBe("Colégio Estadual");
    }
  });

  it("deve remover espaços do início e do fim", () => {
    const result = Destiny.create("  Faculdade  ");

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.value).toBe("Faculdade");
    }
  });

  it("deve rejeitar destino vazio", () => {
    const result = Destiny.create("   ");

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidDestinyError);
    }
  });

  it("deve rejeitar destino com menos de 3 caracteres", () => {
    expect(Destiny.create("ab").isLeft()).toBe(true);
  });

  it("deve rejeitar destino com mais de 150 caracteres", () => {
    expect(Destiny.create("a".repeat(151)).isLeft()).toBe(true);
  });

  it("deve aceitar os limites de 3 e 150 caracteres", () => {
    expect(Destiny.create("abc").isRight()).toBe(true);
    expect(Destiny.create("a".repeat(150)).isRight()).toBe(true);
  });

  it("restore não valida o valor", () => {
    expect(Destiny.restore("x").value).toBe("x");
  });
});
