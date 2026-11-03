import { describe, it, expect, vi, beforeEach } from "vitest";
import { StartVanTripUseCase } from "./StartVanTripUseCase.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { Van } from "../../domain/entities/van/Van.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import { NotVanOwnerError } from "../shared/NotVanOwnerError.js";

describe("StartVanTripUseCase", () => {
  let vanRepository: IVanRepository;
  let sut: StartVanTripUseCase;
  let van: Van;

  const DRIVER_ID = "driver-1";

  beforeEach(() => {
    const vanResult = Van.create({
      model: "Sprinter",
      year: 2022,
      period: "MANHA",
      destiny: "Colégio X",
      capacity: 15,
      driverId: DRIVER_ID,
    });
    if (vanResult.isLeft()) throw new Error("Falha ao montar fixture");
    van = vanResult.value;

    vanRepository = {
      findById: vi.fn().mockResolvedValue(van),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      listAll: vi.fn(),
      listDriverVans: vi.fn(),
      delete: vi.fn(),
    };

    sut = StartVanTripUseCase.create(vanRepository);
  });

  it("deve iniciar o trajeto da van do motorista", async () => {
    const result = await sut.execute({ vanId: van.id, requesterId: DRIVER_ID });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toEqual({ id: van.id, emTrajeto: true });
    }
  });

  it("deve gravar a van com emTrajeto verdadeiro", async () => {
    await sut.execute({ vanId: van.id, requesterId: DRIVER_ID });

    expect(vanRepository.update).toHaveBeenCalledOnce();
    const saved = vi.mocked(vanRepository.update).mock.calls[0]?.[0];
    expect(saved?.emTrajeto).toBe(true);
  });

  it("deve aceitar iniciar quando o trajeto já está em andamento", async () => {
    vanRepository.findById = vi
      .fn()
      .mockResolvedValue(van.alterarStatusTrajeto(true));

    const result = await sut.execute({ vanId: van.id, requesterId: DRIVER_ID });

    expect(result.isRight()).toBe(true);
  });

  it("deve rejeitar quando a van não existe", async () => {
    vanRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      vanId: "inexistente",
      requesterId: DRIVER_ID,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(VanNotFoundError);
    }
  });

  it("deve rejeitar quem não é o motorista dono da van", async () => {
    const result = await sut.execute({
      vanId: van.id,
      requesterId: "outro-motorista",
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotVanOwnerError);
    }
    expect(vanRepository.update).not.toHaveBeenCalled();
  });
});
