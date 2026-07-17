import { describe, it, expect } from "vitest";
import { CollectionPoint } from "./CollectionPoint.js";

describe("CollectionPoint", () => {
  it("deve criar um ponto de coleta válido dentro do Brasil", () => {
    const result = CollectionPoint.create({
      lat: -25.42,
      long: -49.27,
    }); // Curitiba
    expect(result.isRight()).toBe(true);
  });

  it("deve rejeitar coordenadas fora do Brasil", () => {
    const result = CollectionPoint.create({ lat: 48.85, long: 2.35 }); // Paris
    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar lat fora do intervalo -90 a 90", () => {
    const result = CollectionPoint.create({ lat: 200, long: -49.27 });
    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar valores NaN", () => {
    const result = CollectionPoint.create({ lat: NaN, long: -49.27 });
    expect(result.isLeft()).toBe(true);
  });
});
