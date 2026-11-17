import { describe, it, expect } from "vitest";
import { orderByNearestNeighbor } from "./orderByNearestNeighbor.js";

describe("orderByNearestNeighbor", () => {
  // Monta a matriz de distâncias de pontos em uma reta: positions[0] é a origem.
  const fromPositions = (positions: number[]): number[][] =>
    positions.map((a) => positions.map((b) => Math.abs(a - b)));

  it("deve devolver lista vazia quando não há paradas", () => {
    expect(orderByNearestNeighbor([[0]])).toEqual([]);
  });

  it("deve devolver a única parada quando há apenas uma", () => {
    expect(orderByNearestNeighbor(fromPositions([0, 8]))).toEqual([1]);
  });

  it("deve visitar primeiro a parada mais próxima da origem", () => {
    // origem em 0; parada 1 em 10 e parada 2 em 2
    expect(orderByNearestNeighbor(fromPositions([0, 10, 2]))).toEqual([2, 1]);
  });

  it("deve escolher sempre a partir do ponto atual, e não da origem", () => {
    // origem em 0; paradas: 1 em 3, 2 em 7 e 3 em -4.
    // Da origem, a ordem por distância seria [1, 3, 2]; a partir do ponto atual, é [1, 2, 3].
    expect(orderByNearestNeighbor(fromPositions([0, 3, 7, -4]))).toEqual([
      1, 2, 3,
    ]);
  });

  it("deve escolher a parada de menor índice em caso de empate", () => {
    // paradas 1 e 2 a 5 de distância da origem, uma de cada lado
    expect(orderByNearestNeighbor(fromPositions([0, 5, -5]))).toEqual([1, 2]);
  });

  it("deve manter a ordem de cadastro quando as distâncias são desconhecidas", () => {
    const unknown = [0, 1, 2, 3].map(() => [0, 1, 2, 3].map(() => Infinity));
    expect(orderByNearestNeighbor(unknown)).toEqual([1, 2, 3]);
  });

  it("deve incluir todas as paradas exatamente uma vez", () => {
    const order = orderByNearestNeighbor(fromPositions([0, 9, 4, 7, 1, 12]));
    expect([...order].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
