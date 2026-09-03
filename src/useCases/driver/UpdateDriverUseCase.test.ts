import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateDriverUseCase } from "./UpdateDriverUseCase";
import type { IDriverRepository } from "../../domain/repositories/IDriverRepository";
import { Driver } from "../../domain/entities/driver/Driver";

describe("UpdateDriverUseCase", () => {
  let driverRepository: IDriverRepository;
  let sut: UpdateDriverUseCase;
  let driver: Driver;

  const DRIVER_USER_ID = "user-1";

  const validInput = {
    driverId: "",
    requesterId: DRIVER_USER_ID,
    license: "98765432100",
    dateOfBirth: "1985-01-10",
  };

  beforeEach(() => {
    const result = Driver.create({
      userId: DRIVER_USER_ID,
      license: "12345678900",
      dateOfBirth: "1990-05-14",
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    driver = result.value;
    validInput.driverId = driver.id;

    driverRepository = {
      findById: vi.fn().mockResolvedValue(driver),
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    sut = UpdateDriverUseCase.create(driverRepository);
  });

  it("deve atualizar o motorista com sucesso quando o requester é o próprio", async () => {
    const result = await sut.execute(validInput);

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.license).toBe("98765432100");
    }
    expect(driverRepository.update).toHaveBeenCalledOnce();
  });

  it("deve rejeitar quando o requester não é o próprio motorista", async () => {
    const result = await sut.execute({
      ...validInput,
      requesterId: "outro-user",
    });

    expect(result.isLeft()).toBe(true);
    expect(driverRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando o motorista não existe", async () => {
    driverRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute(validInput);

    expect(result.isLeft()).toBe(true);
  });

  it("deve rejeitar CNH com formato inválido", async () => {
    const result = await sut.execute({ ...validInput, license: "123" });

    expect(result.isLeft()).toBe(true);
    expect(driverRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando a nova data de nascimento indica menoridade", async () => {
    const dezesseisAnosAtras = new Date();
    dezesseisAnosAtras.setFullYear(dezesseisAnosAtras.getFullYear() - 16);

    const result = await sut.execute({
      ...validInput,
      dateOfBirth: dezesseisAnosAtras.toISOString().slice(0, 10),
    });

    expect(result.isLeft()).toBe(true);
    expect(driverRepository.update).not.toHaveBeenCalled();
  });
});
