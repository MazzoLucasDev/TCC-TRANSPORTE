import type {
  GeoPoint,
  IRouteCalculatorService,
  RouteCalculatorResult,
  RoutePoint,
} from "../../domain/services/IRouteCalculatorService.js";

const OSRM_BASE_URL = process.env.OSRM_URL ?? "https://router.project-osrm.org";
const AVERAGE_SPEED_KMH = 30;
const MIN_INTERVAL_MS = 1100; // servidor público: no máximo 1 requisição por segundo

export class OsrmRouteCalculatorService implements IRouteCalculatorService {
  private lastCall = 0;

  async calculateFixedOrder(
    origin: GeoPoint,
    points: RoutePoint[],
  ): Promise<RouteCalculatorResult> {
    const route = await this.fetchRoute([origin, ...points]);
    return { order: points.map((p) => p.studentId), ...route };
  }

  async calculateOptimized(
    origin: GeoPoint,
    points: RoutePoint[],
  ): Promise<RouteCalculatorResult> {
    const coords: GeoPoint[] = [origin, ...points];

    // 1ª etapa: vizinho mais próximo usando a distância REAL pelas ruas (matriz do OSRM).
    // Se o OSRM falhar, usa Haversine só para decidir a ordem.
    let matrix: number[][] | null = null;
    try {
      matrix = await this.fetchDistanceMatrix(coords);
    } catch (error) {
      console.error("OSRM (matriz) indisponível, ordem por Haversine:", error);
    }
    const distance = (a: number, b: number): number => {
      if (matrix) return matrix[a]?.[b] ?? Infinity;
      const pa = coords[a];
      const pb = coords[b];
      return pa && pb ? this.haversineDistance(pa, pb) : Infinity;
    };

    const indexes = this.nearestNeighbor(coords.length, distance);
    const ordered: RoutePoint[] = indexes.flatMap((i) => {
      const point = points[i - 1];
      return point ? [point] : [];
    });

    // 2ª etapa: trajeto pelas ruas passando pelas paradas na ordem escolhida
    const route = await this.fetchRoute([origin, ...ordered]);
    return { order: ordered.map((p) => p.studentId), ...route };
  }

  // Heurística do vizinho mais próximo. Índice 0 = origem; 1..n = paradas.
  private nearestNeighbor(
    count: number,
    distance: (a: number, b: number) => number,
  ): number[] {
    const remaining = new Set<number>();
    for (let i = 1; i < count; i++) remaining.add(i);
    const order: number[] = [];
    let current = 0;

    while (remaining.size > 0) {
      let best = -1;
      let bestDistance = Infinity;
      for (const candidate of remaining) {
        const d = distance(current, candidate);
        if (d < bestDistance) {
          bestDistance = d;
          best = candidate;
        }
      }
      if (best === -1) best = remaining.values().next().value as number;
      remaining.delete(best);
      order.push(best);
      current = best;
    }
    return order;
  }

  private async throttle(): Promise<void> {
    const wait = MIN_INTERVAL_MS - (Date.now() - this.lastCall);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    this.lastCall = Date.now();
  }

  private async getJson(url: string): Promise<any> {
    await this.throttle();
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      throw new Error(`OSRM HTTP ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    if (data.code !== "Ok") throw new Error(`OSRM ${data.code}`);
    return data;
  }

  private async fetchDistanceMatrix(points: GeoPoint[]): Promise<number[][]> {
    const coordinates = points.map((p) => `${p.long},${p.lat}`).join(";");
    const data = await this.getJson(
      `${OSRM_BASE_URL}/table/v1/driving/${coordinates}?annotations=distance`,
    );
    return (data.distances as (number | null)[][]).map((row) =>
      row.map((meters) => (meters == null ? Infinity : meters / 1000)),
    );
  }

  private async fetchRoute(
    points: GeoPoint[],
  ): Promise<Omit<RouteCalculatorResult, "order">> {
    const coordinates = points.map((p) => `${p.long},${p.lat}`).join(";");
    try {
      const data = await this.getJson(
        `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`,
      );
      const route = data.routes?.[0];
      if (!route) throw new Error("OSRM não retornou nenhuma rota válida");

      return {
        distanceKm: route.distance / 1000,
        durationMin: route.duration / 60,
        geometry: (route.geometry.coordinates as [number, number][]).map(
          ([long, lat]) => ({ lat, long }),
        ),
        approximate: false,
      };
    } catch (error) {
      console.error("OSRM indisponível, usando linha reta (Haversine):", error);
      let total = 0;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        if (a && b) total += this.haversineDistance(a, b);
      }
      return {
        distanceKm: total,
        durationMin: (total / AVERAGE_SPEED_KMH) * 60,
        geometry: points,
        approximate: true,
      };
    }
  }

  private haversineDistance(a: GeoPoint, b: GeoPoint): number {
    const R = 6371;
    const dLat = this.toRad(b.lat - a.lat);
    const dLong = this.toRad(b.long - a.long);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(a.lat)) *
        Math.cos(this.toRad(b.lat)) *
        Math.sin(dLong / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
