import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateVanUseCase } from "./UpdateVanUseCase";
import type { IVanRepository } from "../../domain/repositories/IVanRepository";
import { Van } from "../../domain/entities/van/Van";

describe("UpdateVanUseCase", () => {
  let vanRepository: IVanRepository;
  let sut: UpdateVanUseCase;
  let van: Van;

  const DRIVER_ID = "driver-1";

  const validInput = {
    vanId: "",
    requesterId: DRIVER_ID,
    model: "Sprinter Nova",
    year: 2023,
    period: "TARDE",
    destiny: "Colégio Y",
    capacity: 18,
  };

  beforeEach(() => {
    const vanResult = Van.create({
      model: "Sprinter",
      year: 2022,
      period: "MANHA",
      destiny: "Colégio X",
      capacity: 15,
      driverId: DRIVER_ID,
    });
    if (vanResult.isLeft()) throw new Error("Falha ao montar van");
    van = vanResult.value;
    validInput.vanId = van.id;

    vanRepository = {
      findById: vi.fn().mockResolvedValue(van),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      listAll: vi.fn(),
      listDriverVans: vi.fn(),
      delete: vi.fn(),
    };

    sut = UpdateVanUseCase.create(vanRepository);
  });

  it("deve atualizar a van com sucesso quando o requester é o dono", async () => {
    const result = await sut.execute(validInput);

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.model).toBe("Sprinter Nova");
      expect(result.value.capacity).toBe(18);
    }
    expect(vanRepository.update).toHaveBeenCalledOnce();
  });

  it("deve preservar o id e o emTrajeto originais após atualizar", async () => {
    await sut.execute(validInput);

    const updatedVanPassed = (vanRepository.update as any).mock.calls[0][0];
    expect(updatedVanPassed.id).toBe(van.id);
    expect(updatedVanPassed.emTrajeto).toBe(van.emTrajeto);
  });

  it("deve rejeitar quando o requester não é o dono da van", async () => {
    const result = await sut.execute({
      ...validInput,
      requesterId: "outro-motorista",
    });

    expect(result.isLeft()).toBe(true);
    expect(vanRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando a van não existe", async () => {
    vanRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute(validInput);

    expect(result.isLeft()).toBe(true);
    expect(vanRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar dados inválidos (capacidade zero)", async () => {
    const result = await sut.execute({ ...validInput, capacity: 0 });

    expect(result.isLeft()).toBe(true);
    expect(vanRepository.update).not.toHaveBeenCalled();
  });
});
