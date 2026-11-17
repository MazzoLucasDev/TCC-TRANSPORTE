// Heurística do vizinho mais próximo, usada na rota otimizada.
// `distances[a][b]` é a distância de a para b; o índice 0 é a origem e 1..n são as paradas.
// Devolve os índices das paradas (1..n) na ordem de visita: a cada passo vai para a
// parada ainda não visitada que está mais perto do ponto atual. Em caso de empate,
// escolhe a de menor índice. Não garante o menor percurso total.
export function orderByNearestNeighbor(distances: number[][]): number[] {
  const remaining: number[] = [];
  for (let i = 1; i < distances.length; i++) remaining.push(i);

  const order: number[] = [];
  let current = 0;

  while (remaining.length > 0) {
    let bestPosition = 0;
    let bestDistance = Infinity;

    remaining.forEach((candidate, position) => {
      const distance = distances[current]?.[candidate] ?? Infinity;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPosition = position;
      }
    });

    const [next] = remaining.splice(bestPosition, 1);
    if (next === undefined) break;
    order.push(next);
    current = next;
  }

  return order;
}
