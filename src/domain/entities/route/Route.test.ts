import { describe, it, expect } from "vitest";
import { Route } from "./Route.js";
import { InvalidRouteError } from "./errors/InvalidRouteError.js";

describe("Route", () => {
  const validRouteProps = {
    vanId: "van-1",
    date: new Date("2026-07-17"),
    type: "OPTIMIZED" as const,
    studentOrder: ["student-1", "student-2", "student-3"],
    distanceKm: 12.5,
    durationMin: 25,
  };

  const build = (overrides = {}) => {
    const result = Route.create({ ...validRouteProps, ...overrides });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    return result.value;
  };

  it("deve criar uma rota válida", () => {
    const result = Route.create(validRouteProps);
    expect(result.isRight()).toBe(true);
  });

  it("deve expor os dados informados pelos getters", () => {
    const route = build();

    expect(route.id).toEqual(expect.any(String));
    expect(route.vanId).toBe("van-1");
    expect(route.date).toEqual(new Date("2026-07-17"));
    expect(route.type).toBe("OPTIMIZED");
    expect(route.studentOrder).toEqual(["student-1", "student-2", "student-3"]);
    expect(route.distanceKm).toBe(12.5);
    expect(route.durationMin).toBe(25);
  });

  it("deve rejeitar van sem identificador", () => {
    const result = Route.create({ ...validRouteProps, vanId: "   " });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidRouteError);
    }
  });

  it("deve rejeitar rota sem alunos", () => {
    const result = Route.create({ ...validRouteProps, studentOrder: [] });
    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar distância negativa", () => {
    const result = Route.create({ ...validRouteProps, distanceKm: -5 });
    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar duração negativa", () => {
    const result = Route.create({ ...validRouteProps, durationMin: -1 });
    expect(result.isLeft()).toBe(true);
  });

  it("deve aceitar distância e duração iguais a zero", () => {
    const result = Route.create({
      ...validRouteProps,
      distanceKm: 0,
      durationMin: 0,
    });
    expect(result.isRight()).toBe(true);
  });

  it("isOptimized deve retornar true para rota do tipo OPTIMIZED", () => {
    expect(build().isOptimized()).toBe(true);
  });

  it("isOptimized deve retornar false para rota do tipo SIMPLE", () => {
    expect(build({ type: "SIMPLE" }).isOptimized()).toBe(false);
  });

  it("toPersistence deve devolver todos os campos para o banco", () => {
    const route = build();

    expect(route.toPersistence()).toEqual({
      id: route.id,
      vanId: "van-1",
      date: new Date("2026-07-17"),
      type: "OPTIMIZED",
      studentOrder: ["student-1", "student-2", "student-3"],
      distanceKm: 12.5,
      durationMin: 25,
    });
  });

  it("reconstitute deve recriar a rota com o mesmo id, sem validar", () => {
    const route = Route.reconstitute({
      id: "route-1",
      vanId: "van-1",
      date: new Date("2026-07-17"),
      type: "SIMPLE",
      studentOrder: ["student-1"],
      distanceKm: 3,
      durationMin: 8,
    });

    expect(route.id).toBe("route-1");
    expect(route.type).toBe("SIMPLE");
    expect(route.isOptimized()).toBe(false);
    expect(route.studentOrder).toEqual(["student-1"]);
  });
});
