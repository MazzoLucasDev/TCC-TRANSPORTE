import { describe, it, expect, afterEach, afterAll } from "vitest";
import { PrismaDriverRepository } from "./PrismaDriverRepository.js";
import { PrismaUserRepository } from "./PrismaUserRepository.js";
import { Driver } from "../../domain/entities/driver/Driver.js";
import { User } from "../../domain/entities/user/User.js";
import { prismaClient } from "../database/prismaClient.js";

describe("PrismaDriverRepository (integração)", () => {
  const sut = new PrismaDriverRepository();
  const userRepository = new PrismaUserRepository();
  const createdDriverIds: string[] = [];
  const createdUserIds: string[] = [];

  afterEach(async () => {
    for (const id of createdDriverIds) {
      await prismaClient.driverModel.delete({ where: { id } }).catch(() => {});
    }
    createdDriverIds.length = 0;
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      await prismaClient.userModel.delete({ where: { id } }).catch(() => {});
    }
  });

  const buildDriverWithUser = async () => {
    const userResult = User.create({
      name: "Motorista Teste",
      email: `driver-repo-test-${crypto.randomUUID()}@email.com`,
      password: "Senha123",
      phone: "41988888888",
      userType: "MOTORISTA",
    });
    if (userResult.isLeft()) throw new Error("Falha ao montar user");
    await userRepository.create(userResult.value);
    createdUserIds.push(userResult.value.id);

    const driverResult = Driver.create({
      userId: userResult.value.id,
      license: "12345678900",
      dateOfBirth: "1990-05-14",
    });
    if (driverResult.isLeft()) throw new Error("Falha ao montar driver");

    return driverResult.value;
  };

  it("deve criar e encontrar um motorista pelo id", async () => {
    const driver = await buildDriverWithUser();
    createdDriverIds.push(driver.id);

    await sut.create(driver);
    const found = await sut.findById(driver.id);

    expect(found).not.toBeNull();
    expect(found?.license.value).toBe("12345678900");
  });

  it("deve encontrar um motorista pelo userId", async () => {
    const driver = await buildDriverWithUser();
    createdDriverIds.push(driver.id);
    await sut.create(driver);

    const found = await sut.findByUserId(driver.userId);

    expect(found?.id).toBe(driver.id);
  });

  it("deve preservar a idade calculada corretamente após reconstituir do banco", async () => {
    const driver = await buildDriverWithUser();
    createdDriverIds.push(driver.id);
    await sut.create(driver);

    const found = await sut.findById(driver.id);

    expect(found?.getAge()).toBe(driver.getAge());
  });

  it("deve retornar null quando o motorista não existe", async () => {
    const found = await sut.findById("id-inexistente");
    expect(found).toBeNull();
  });

  it("deve deletar um motorista", async () => {
    const driver = await buildDriverWithUser();
    await sut.create(driver);

    await sut.delete(driver.id);

    const found = await sut.findById(driver.id);
    expect(found).toBeNull();
  });
});
