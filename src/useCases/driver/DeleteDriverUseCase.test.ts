import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteDriverUseCase } from "./DeleteDriverUseCase";
import type { IDriverRepository } from "../../domain/repositories/IDriverRepository";
import { Driver } from "../../domain/entities/driver/Driver";

describe("DeleteDriverUseCase", () => {
  let driverRepository: IDriverRepository;
  let sut: DeleteDriverUseCase;
  let driver: Driver;

  const DRIVER_USER_ID = "user-1";

  beforeEach(() => {
    const result = Driver.create({
      userId: DRIVER_USER_ID,
      license: "12345678900",
      dateOfBirth: "1990-05-14",
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    driver = result.value;

    driverRepository = {
      findById: vi.fn().mockResolvedValue(driver),
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    sut = DeleteDriverUseCase.create(driverRepository);
  });

  it("deve deletar o motorista quando o requester é o próprio", async () => {
    const result = await sut.execute({
      driverId: driver.id,
      requesterId: DRIVER_USER_ID,
    });

    expect(result.isRight()).toBe(true);
    expect(driverRepository.delete).toHaveBeenCalledWith(driver.id);
  });

  it("deve rejeitar quando o requester não é o próprio motorista", async () => {
    const result = await sut.execute({
      driverId: driver.id,
      requesterId: "outro-user",
    });

    expect(result.isLeft()).toBe(true);
    expect(driverRepository.delete).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando o motorista não existe", async () => {
    driverRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      driverId: "inexistente",
      requesterId: DRIVER_USER_ID,
    });

    expect(result.isLeft()).toBe(true);
    expect(driverRepository.delete).not.toHaveBeenCalled();
  });
});
