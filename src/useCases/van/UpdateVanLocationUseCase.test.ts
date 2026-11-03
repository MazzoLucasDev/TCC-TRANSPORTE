import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateVanLocationUseCase } from "./UpdateVanLocationUseCase.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import type { IVanLocationRepository } from "../../domain/repositories/IVanLocationRepository.js";
import { Van } from "../../domain/entities/van/Van.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import { InvalidCoordinatesError } from "../../domain/shared/errors/InvalidCoordinatesError.js";
import { NotVanOwnerError } from "../shared/NotVanOwnerError.js";
import { VanNotInTripError } from "./errors/VanNotInTripError.js";

describe("UpdateVanLocationUseCase", () => {
  let vanRepository: IVanRepository;
  let vanLocationRepository: IVanLocationRepository;
  let sut: UpdateVanLocationUseCase;
  let van: Van;

  const DRIVER_ID = "driver-1";

  const input = (overrides: Record<string, unknown> = {}) => ({
    vanId: van.id,
    requesterId: DRIVER_ID,
    lat: -22.9,
    long: -49.87,
    ...overrides,
  });

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
      update: vi.fn(),
      listAll: vi.fn(),
      listDriverVans: vi.fn(),
      delete: vi.fn(),
    };

    vanLocationRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findByVanId: vi.fn(),
      delete: vi.fn(),
    };

    sut = UpdateVanLocationUseCase.create(vanRepository, vanLocationRepository);
  });

  it("deve guardar a posição e devolver os dados com o horário", async () => {
    const result = await sut.execute(input());

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.vanId).toBe(van.id);
      expect(result.value.lat).toBe(-22.9);
      expect(result.value.long).toBe(-49.87);
      expect(Number.isNaN(Date.parse(result.value.updatedAt))).toBe(false);
    }
    expect(vanLocationRepository.save).toHaveBeenCalledOnce();
    const saved = vi.mocked(vanLocationRepository.save).mock.calls[0]?.[0];
    expect(saved?.vanId).toBe(van.id);
    expect(saved?.coordinates.value).toEqual({ lat: -22.9, long: -49.87 });
  });

  it("deve rejeitar quando a van não existe", async () => {
    vanRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute(input({ vanId: "inexistente" }));

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(VanNotFoundError);
    }
  });

  it("deve rejeitar quem não é o motorista dono da van", async () => {
    const result = await sut.execute(input({ requesterId: "outro-motorista" }));

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotVanOwnerError);
    }
    expect(vanLocationRepository.save).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando a van não está em trajeto", async () => {
    vanRepository.findById = vi
      .fn()
      .mockResolvedValue(van.alterarStatusTrajeto(false));

    const result = await sut.execute(input());

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(VanNotInTripError);
    }
    expect(vanLocationRepository.save).not.toHaveBeenCalled();
  });

  it("deve rejeitar coordenadas inválidas sem gravar", async () => {
    const result = await sut.execute(input({ lat: 999 }));

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCoordinatesError);
    }
    expect(vanLocationRepository.save).not.toHaveBeenCalled();
  });

  it("deve rejeitar coordenadas que não são número", async () => {
    const result = await sut.execute(input({ lat: "abc", long: null }));

    expect(result.isLeft()).toBe(true);
    expect(vanLocationRepository.save).not.toHaveBeenCalled();
  });
});
