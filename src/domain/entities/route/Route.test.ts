import { describe, it, expect } from "vitest";
import { Route } from "./Route.js";

describe("Route", () => {
  const validRouteProps = {
    vanId: "van-1",
    date: new Date("2026-07-17"),
    type: "OPTIMIZED" as const,
    studentOrder: ["student-1", "student-2", "student-3"],
    distanceKM: 12.5,
    durationMin: 25,
  };

  it("deve criar uma rota válida", () => {
    const result = Route.create(validRouteProps);
    expect(result.isRight()).toBe(true);
  });

  it("deve rejeitar rota sem alunos", () => {
    const result = Route.create({ ...validRouteProps, studentOrder: [] });
    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar distância negativa", () => {
    const result = Route.create({ ...validRouteProps, distanceKM: -5 });
    expect(result.isLeft()).toBe(true);
  });

  it("isOptimized deve retornar true para rota do tipo OPTIMIZED", () => {
    const result = Route.create(validRouteProps);
    if (result.isRight()) {
      expect(result.value.isOptimized()).toBe(true);
    }
  });

  it("isOptimized deve retornar false para rota do tipo SIMPLE", () => {
    const result = Route.create({ ...validRouteProps, type: "SIMPLE" });
    if (result.isRight()) {
      expect(result.value.isOptimized()).toBe(false);
    }
  });
});
