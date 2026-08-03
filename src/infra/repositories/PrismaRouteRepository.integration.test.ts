// PrismaRouteRepository.integration.test.ts
import { describe, it, expect, afterEach, afterAll, beforeAll } from "vitest";
import { PrismaRouteRepository } from "./PrismaRouteRepository.js";
import { PrismaUserRepository } from "./PrismaUserRepository.js";
import { PrismaVanRepository } from "./PrismaVanRepository.js";
import { Route } from "../../domain/entities/route/Route.js";
import { User } from "../../domain/entities/user/User.js";
import { Van } from "../../domain/entities/van/Van.js";
import { prismaClient } from "../database/prismaClient.js";

describe("PrismaRouteRepository (integração)", () => {
  const sut = new PrismaRouteRepository();
  const userRepository = new PrismaUserRepository();
  const vanRepository = new PrismaVanRepository();
  const createdRouteIds: string[] = [];
  let vanId: string;
  let driverUserId: string;

  beforeAll(async () => {
    const driverUserResult = User.create({
      name: "Motorista Teste",
      email: `motorista-route-test-${crypto.randomUUID()}@email.com`,
      password: "Senha123",
      phone: "41988888888",
      userType: "MOTORISTA",
    });
    if (driverUserResult.isLeft()) throw new Error("Falha motorista");
    await userRepository.create(driverUserResult.value);
    driverUserId = driverUserResult.value.id;

    const vanResult = Van.create({
      model: "Sprinter",
      year: 2022,
      period: "MANHA",
      destiny: "Colégio X",
      capacity: 15,
      driverId: driverUserId,
    });
    if (vanResult.isLeft()) throw new Error("Falha van");
    await vanRepository.create(vanResult.value);
    vanId = vanResult.value.id;
  });

  afterEach(async () => {
    for (const id of createdRouteIds) {
      await prismaClient.routeModel.delete({ where: { id } }).catch(() => {});
    }
    createdRouteIds.length = 0;
  });

  afterAll(async () => {
    await prismaClient.vanModel
      .delete({ where: { id: vanId } })
      .catch(() => {});
    await prismaClient.userModel
      .delete({ where: { id: driverUserId } })
      .catch(() => {});
  });

  const buildRoute = (type: "SIMPLE" | "OPTIMIZED") => {
    const result = Route.create({
      vanId,
      date: new Date("2026-08-01"),
      type,
      studentOrder: ["student-1", "student-2"],
      distanceKm: 5.4,
      durationMin: 12,
    });
    if (result.isLeft()) throw new Error("Falha fixture");
    return result.value;
  };

  it("deve criar e encontrar uma rota pelo id, preservando a ordem dos alunos", async () => {
    const route = buildRoute("OPTIMIZED");
    createdRouteIds.push(route.id);

    await sut.create(route);
    const found = await sut.findById(route.id);

    expect(found).not.toBeNull();
    expect(found?.studentOrder).toEqual(["student-1", "student-2"]);
    expect(found?.isOptimized()).toBe(true);
  });

  it("deve listar as duas rotas (simples e otimizada) de uma van numa data", async () => {
    const simple = buildRoute("SIMPLE");
    const optimized = buildRoute("OPTIMIZED");
    createdRouteIds.push(simple.id, optimized.id);

    await sut.create(simple);
    await sut.create(optimized);

    const found = await sut.listByVanAndDate(vanId, new Date("2026-08-01"));

    expect(found).toHaveLength(2);
    expect(found.map((r) => r.type)).toEqual(
      expect.arrayContaining(["SIMPLE", "OPTIMIZED"]),
    );
  });
});
