import { describe, expect, it } from "vitest";
import { Van } from "./Van.js";

describe("Van", () => {
  const validVanData = {
    model: "sprinter",
    year: 2022,
    period: "MANHA",
    destiny: "Colégio X",
    capacity: 24,
    driverId: "driver-1",
    emTrajeto: false,
  };

  it("deve criar uma van válida!", () => {
    const result = Van.create(validVanData);
    expect(result.isRight()).toBe(true);
  });

  it("deve rejeitar capacidade zero!", () => {
    const result = Van.create({ ...validVanData, capacity: 0 });
    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar ano fora do intervalo permitido!", () => {
    const result = Van.create({ ...validVanData, year: 1900 });
    expect(result.isLeft()).toBe(true);
  });
  it("deve rejeitar periodo inválido!", () => {
    const result = Van.create({ ...validVanData, period: "MADRUGADA" });
    expect(result.isLeft()).toBe(true);
  });
  it("deve rejeitar driver ID vazio!", () => {
    const result = Van.create({ ...validVanData, driverId: "" });
    expect(result.isLeft()).toBe(true);
  });
  it("deve começar fora de rota!", () => {
    const result = Van.create(validVanData);
    if (result.isRight()) {
      expect(result.value.emTrajeto).toBe(false);
    }
  });
  describe("verificarCapacidade", () => {
    it("deve retornar true quando há vaga!", () => {
      const result = Van.create(validVanData);
      if (result.isRight()) {
        expect(result.value.verificarCapacidade(10)).toBe(true);
      }
    });
    it("deve retornar false quando a van está cheia!", () => {
      const result = Van.create(validVanData);
      if (result.isRight()) {
        expect(result.value.verificarCapacidade(24)).toBe(false);
      }
    });
  });
  describe("alterarStatusTrajeto", () => {
    it("deve retornar uma nova van com emTrajeto atualizado!", () => {
      const result = Van.create(validVanData);
      if (result.isRight()) {
        const vanEmTrajeto = result.value.alterarStatusTrajeto(true);
        expect(vanEmTrajeto.emTrajeto).toBe(true);
        expect(result.value.emTrajeto).toBe(false);
      }
    });
  });
});
