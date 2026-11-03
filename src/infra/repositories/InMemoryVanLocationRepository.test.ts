import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryVanLocationRepository } from "./InMemoryVanLocationRepository.js";
import { VanLocation } from "../../domain/entities/van/VanLocation.js";

describe("InMemoryVanLocationRepository", () => {
  let sut: InMemoryVanLocationRepository;

  const build = (vanId: string, lat: number, long: number) => {
    const result = VanLocation.create({ vanId, lat, long });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    return result.value;
  };

  beforeEach(() => {
    sut = new InMemoryVanLocationRepository();
  });

  it("deve devolver null quando a van não tem posição", async () => {
    expect(await sut.findByVanId("van-1")).toBeNull();
  });

  it("deve guardar e recuperar a posição da van", async () => {
    const location = build("van-1", -22.9, -49.87);

    await sut.save(location);

    expect(await sut.findByVanId("van-1")).toBe(location);
  });

  it("deve manter só a última posição de cada van", async () => {
    await sut.save(build("van-1", -22.9, -49.87));
    const latest = build("van-1", -22.91, -49.88);
    await sut.save(latest);

    const found = await sut.findByVanId("van-1");

    expect(found?.coordinates.value).toEqual({ lat: -22.91, long: -49.88 });
  });

  it("não deve misturar posições de vans diferentes", async () => {
    await sut.save(build("van-1", -22.9, -49.87));
    await sut.save(build("van-2", -23.5, -46.6));

    expect((await sut.findByVanId("van-1"))?.coordinates.value.lat).toBe(-22.9);
    expect((await sut.findByVanId("van-2"))?.coordinates.value.lat).toBe(-23.5);
  });

  it("deve apagar a posição da van", async () => {
    await sut.save(build("van-1", -22.9, -49.87));

    await sut.delete("van-1");

    expect(await sut.findByVanId("van-1")).toBeNull();
  });

  it("não deve falhar ao apagar uma van sem posição", async () => {
    await expect(sut.delete("inexistente")).resolves.toBeUndefined();
  });
});
