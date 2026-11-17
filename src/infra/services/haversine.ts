import type {
  GeoPoint,
  RouteMetrics,
} from "../../domain/services/IRouteCalculatorService.js";

export const AVERAGE_SPEED_KMH = 30;

const EARTH_RADIUS_KM = 6371;

const toRad = (degrees: number): number => (degrees * Math.PI) / 180;

// Distância em linha reta entre dois pontos, pela fórmula de Haversine.
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLong = toRad(b.long - a.long);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLong / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Matriz de distâncias em linha reta entre todos os pares de pontos.
export function buildHaversineMatrix(points: GeoPoint[]): number[][] {
  return points.map((a) => points.map((b) => haversineDistanceKm(a, b)));
}

// Percurso em linha reta pelos pontos, na ordem recebida (o primeiro é a origem).
// O tempo é estimado com velocidade média fixa e o resultado é marcado como aproximado.
export function buildStraightLineRoute(points: GeoPoint[]): RouteMetrics {
  let distanceKm = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (a && b) distanceKm += haversineDistanceKm(a, b);
  }
  return {
    distanceKm,
    durationMin: (distanceKm / AVERAGE_SPEED_KMH) * 60,
    geometry: points.map(({ lat, long }) => ({ lat, long })),
    approximate: true,
  };
}
