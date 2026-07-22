import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListDriverVansUseCase } from "./ListDriverVansUseCase.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { Van } from "../../domain/entities/van/Van.js";

describe("ListDriverVansUseCase", () => {
  let vanRepository: IVanRepository;
  let sut: ListDriverVansUseCase;

  const buildVan = () => {
    const result = Van.create({
      model: "Sprinter",
      year: 2022,
      period: "MANHA",
      destiny: "Colégio X",
      capacity: 15,
      driverId: "driver-1",
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    return result.value;
  };

  beforeEach(() => {
    vanRepository = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      listDriverVans: vi.fn().mockResolvedValue([buildVan(), buildVan()]),
      delete: vi.fn(),
    };

    sut = ListDriverVansUseCase.create(vanRepository);
  });

  it("deve listar as vans do motorista", async () => {
    const result = await sut.execute({ driverId: "driver-1" });

    expect(result.vansProps).toHaveLength(2);
    expect(result.vansProps[0]).toEqual({
      id: expect.any(String),
      model: "Sprinter",
      year: 2022,
      period: "MANHA",
      destiny: "Colégio X",
      capacity: 15,
      emTrajeto: false,
    });
  });

  it("deve retornar lista vazia quando o motorista não tem vans", async () => {
    vanRepository.listDriverVans = vi.fn().mockResolvedValue([]);

    const result = await sut.execute({ driverId: "driver-sem-vans" });

    expect(result.vansProps).toEqual([]);
  });

  it("deve chamar o repository com o driverId correto", async () => {
    await sut.execute({ driverId: "driver-1" });

    expect(vanRepository.listDriverVans).toHaveBeenCalledWith("driver-1");
  });
});
