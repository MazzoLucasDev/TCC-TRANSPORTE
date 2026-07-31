import { describe, it, expect, afterEach, beforeAll, afterAll } from "vitest";
import { PrismaVanRepository } from "./PrismaVanRepository.js";
import { PrismaUserRepository } from "./PrismaUserRepository.js";
import { Van } from "../../domain/entities/van/Van.js";
import { User } from "../../domain/entities/user/User.js";
import { prismaClient } from "../database/prismaClient.js";

describe("PrismaVanRepository (integração)", () => {
  const sut = new PrismaVanRepository();
  const userRepository = new PrismaUserRepository();
  const createdVanIds: string[] = [];
  let driverId: string;

  beforeAll(async () => {
    const driverResult = User.create({
      name: "Motorista Teste",
      email: `motorista-van-test-${crypto.randomUUID()}@email.com`, // e-mail único a cada execução
      password: "Senha123",
      phone: "41988888888",
      userType: "MOTORISTA",
    });
    if (driverResult.isLeft())
      throw new Error("Falha ao montar motorista de teste");

    await userRepository.create(driverResult.value);
    driverId = driverResult.value.id;
  });

  afterEach(async () => {
    for (const id of createdVanIds) {
      await prismaClient.vanModel.delete({ where: { id } }).catch(() => {});
    }
    createdVanIds.length = 0;
  });

  afterAll(async () => {
    await prismaClient.userModel
      .delete({ where: { id: driverId } })
      .catch(() => {});
  });

  const buildVan = () => {
    const result = Van.create({
      model: "Sprinter",
      year: 2022,
      period: "MANHA",
      destiny: "Colégio X",
      capacity: 15,
      driverId,
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture de van");
    return result.value;
  };

  it("deve criar e encontrar uma van pelo id", async () => {
    const van = buildVan();
    createdVanIds.push(van.id);

    await sut.create(van);
    const found = await sut.findById(van.id);

    expect(found).not.toBeNull();
    expect(found?.model.value).toBe("Sprinter");
    expect(found?.emTrajeto).toBe(false);
  });

  it("deve listar as vans de um motorista específico", async () => {
    const van1 = buildVan();
    const van2 = buildVan();
    createdVanIds.push(van1.id, van2.id);

    await sut.create(van1);
    await sut.create(van2);

    const found = await sut.listDriverVans(driverId);

    expect(found.length).toBeGreaterThanOrEqual(2);
    expect(found.map((v) => v.id)).toEqual(
      expect.arrayContaining([van1.id, van2.id]),
    );
  });

  it("deve atualizar o status de trajeto da van", async () => {
    const van = buildVan();
    createdVanIds.push(van.id);
    await sut.create(van);

    const emTrajeto = van.alterarStatusTrajeto(true);
    await sut.update(emTrajeto);

    const found = await sut.findById(van.id);
    expect(found?.emTrajeto).toBe(true);
  });

  it("deve deletar uma van", async () => {
    const van = buildVan();
    await sut.create(van);

    await sut.delete(van.id);

    const found = await sut.findById(van.id);
    expect(found).toBeNull();
  });
});
