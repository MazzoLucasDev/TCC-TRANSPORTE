import { describe, it, expect, beforeEach } from "vitest";
import { HaversineRouteCalculatorService } from "./HaversineRouteCalculatorService.js";
import type { RoutePoint } from "../../domain/services/IRouteCalculatorService.js";

describe("HaversineRouteCalculatorService", () => {
  let sut: HaversineRouteCalculatorService;

  const origin = { lat: -25.4284, long: -49.2733 }; // Centro de Curitiba
  const far: RoutePoint = { studentId: "far", lat: -25.45, long: -49.3 };
  const near: RoutePoint = { studentId: "near", lat: -25.43, long: -49.275 };

  beforeEach(() => {
    sut = new HaversineRouteCalculatorService();
  });

  describe("getDistanceMatrix", () => {
    it("deve devolver uma matriz quadrada com a origem e todas as paradas", async () => {
      const matrix = await sut.getDistanceMatrix(origin, [far, near]);

      expect(matrix).toHaveLength(3);
      matrix.forEach((row) => expect(row).toHaveLength(3));
    });

    it("deve ter diagonal zero e ser simétrica", async () => {
      const matrix = await sut.getDistanceMatrix(origin, [far, near]);

      for (let i = 0; i < matrix.length; i++) {
        expect(matrix[i]![i]).toBe(0);
        for (let j = 0; j < matrix.length; j++) {
          expect(matrix[i]![j]).toBeCloseTo(matrix[j]![i]!, 9);
        }
      }
    });

    it("deve calcular a distância de um grau de latitude pela fórmula de Haversine", async () => {
      const matrix = await sut.getDistanceMatrix({ lat: 0, long: 0 }, [
        { studentId: "a", lat: 1, long: 0 },
      ]);

      // 2 * pi * 6371 / 360 = 111,19 km
      expect(matrix[0]![1]).toBeCloseTo(111.19, 1);
    });

    it("deve devolver só a origem quando não há paradas", async () => {
      const matrix = await sut.getDistanceMatrix(origin, []);

      expect(matrix).toEqual([[0]]);
    });
  });

  describe("calculateRoute", () => {
    it("deve somar os trechos na ordem recebida", async () => {
      const result = await sut.calculateRoute({ lat: 0, long: 0 }, [
        { studentId: "a", lat: 1, long: 0 },
        { studentId: "b", lat: 2, long: 0 },
      ]);

      expect(result.distanceKm).toBeCloseTo(222.39, 1);
    });

    it("deve estimar o tempo pela velocidade média de 30 km/h", async () => {
      const result = await sut.calculateRoute(origin, [far, near]);

      expect(result.durationMin).toBeCloseTo(result.distanceKm * 2, 6);
    });

    it("deve devolver o traçado em linha reta na ordem recebida e marcá-lo como aproximado", async () => {
      const result = await sut.calculateRoute(origin, [far, near]);

      expect(result.geometry).toEqual([
        origin,
        { lat: far.lat, long: far.long },
        { lat: near.lat, long: near.long },
      ]);
      expect(result.approximate).toBe(true);
    });

    it("não deve reordenar as paradas", async () => {
      const farFirst = await sut.calculateRoute(origin, [far, near]);
      const nearFirst = await sut.calculateRoute(origin, [near, far]);

      expect(nearFirst.geometry[1]).toEqual({ lat: near.lat, long: near.long });
      expect(farFirst.geometry[1]).toEqual({ lat: far.lat, long: far.long });
    });

    it("deve devolver distância zero e só a origem quando não há paradas", async () => {
      const result = await sut.calculateRoute(origin, []);

      expect(result.distanceKm).toBe(0);
      expect(result.geometry).toEqual([origin]);
    });
  });
});
