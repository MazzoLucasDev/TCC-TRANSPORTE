import { describe, it, expect, vi, beforeEach } from "vitest";
import { EndVanTripUseCase } from "./EndVanTripUseCase.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import type { IVanLocationRepository } from "../../domain/repositories/IVanLocationRepository.js";
import { Van } from "../../domain/entities/van/Van.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import { NotVanOwnerError } from "../shared/NotVanOwnerError.js";

describe("EndVanTripUseCase", () => {
  let vanRepository: IVanRepository;
  let vanLocationRepository: IVanLocationRepository;
  let sut: EndVanTripUseCase;
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
    van = vanResult.value.alterarStatusTrajeto(true);

    vanRepository = {
      findById: vi.fn().mockResolvedValue(van),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      listAll: vi.fn(),
      listDriverVans: vi.fn(),
      delete: vi.fn(),
    };

    vanLocationRepository = {
      save: vi.fn(),
      findByVanId: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    sut = EndVanTripUseCase.create(vanRepository, vanLocationRepository);
  });

  it("deve encerrar o trajeto da van do motorista", async () => {
    const result = await sut.execute({ vanId: van.id, requesterId: DRIVER_ID });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toEqual({ id: van.id, emTrajeto: false });
    }
  });

  it("deve gravar a van com emTrajeto falso", async () => {
    await sut.execute({ vanId: van.id, requesterId: DRIVER_ID });

    const saved = vi.mocked(vanRepository.update).mock.calls[0]?.[0];
    expect(saved?.emTrajeto).toBe(false);
  });

  it("deve apagar a última posição da van", async () => {
    await sut.execute({ vanId: van.id, requesterId: DRIVER_ID });

    expect(vanLocationRepository.delete).toHaveBeenCalledWith(van.id);
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

  it("deve rejeitar quem não é o dono e não apagar nada", async () => {
    const result = await sut.execute({
      vanId: van.id,
      requesterId: "outro-motorista",
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotVanOwnerError);
    }
    expect(vanRepository.update).not.toHaveBeenCalled();
    expect(vanLocationRepository.delete).not.toHaveBeenCalled();
  });
});
