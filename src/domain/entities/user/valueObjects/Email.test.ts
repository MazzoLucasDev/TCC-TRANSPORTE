import { describe, it, expect } from "vitest";
import { Email } from "./Email.js";
import { InvalidEmailError } from "../errors/InvalidEmailError.js";

describe("Email", () => {
  it("deve criar um e-mail válido", () => {
    const result = Email.create("ana@email.com");

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.value).toBe("ana@email.com");
    }
  });

  it("deve normalizar para minúsculo e sem espaços", () => {
    const result = Email.create("  ANA@EMAIL.COM ");

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.value).toBe("ana@email.com");
    }
  });

  it("deve rejeitar e-mail vazio", () => {
    const result = Email.create("");

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidEmailError);
    }
  });

  it("deve rejeitar e-mail sem arroba", () => {
    expect(Email.create("ana.email.com").isLeft()).toBe(true);
  });

  it("deve rejeitar e-mail sem domínio", () => {
    expect(Email.create("ana@").isLeft()).toBe(true);
  });

  it("deve rejeitar e-mail com mais de um arroba", () => {
    expect(Email.create("ana@@email.com").isLeft()).toBe(true);
  });

  it("deve rejeitar e-mail com mais de 256 caracteres", () => {
    const longEmail = `${"a".repeat(250)}@email.com`;

    expect(Email.create(longEmail).isLeft()).toBe(true);
  });

  it("deve rejeitar parte local com mais de 64 caracteres", () => {
    const longAccount = `${"a".repeat(65)}@email.com`;

    expect(Email.create(longAccount).isLeft()).toBe(true);
  });

  it("deve rejeitar parte do domínio com mais de 63 caracteres", () => {
    const longDomain = `ana@${"b".repeat(64)}.com`;

    expect(Email.create(longDomain).isLeft()).toBe(true);
  });

  it("restore não valida o valor", () => {
    expect(Email.restore("qualquer").value).toBe("qualquer");
  });
});
