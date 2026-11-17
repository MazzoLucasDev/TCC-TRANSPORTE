import type {
  GeoPoint,
  IRouteCalculatorService,
  RouteMetrics,
  RoutePoint,
} from "../../domain/services/IRouteCalculatorService.js";
import { buildHaversineMatrix, buildStraightLineRoute } from "./haversine.js";

const OSRM_BASE_URL = process.env.OSRM_URL ?? "https://router.project-osrm.org";
const MIN_INTERVAL_MS = 1100; // servidor público: no máximo 1 requisição por segundo

export class OsrmRouteCalculatorService implements IRouteCalculatorService {
  private lastCall = 0;

  // Matriz de distâncias reais pelas ruas. Se o OSRM falhar, usa Haversine.
  async getDistanceMatrix(
    origin: GeoPoint,
    points: RoutePoint[],
  ): Promise<number[][]> {
    const coords: GeoPoint[] = [origin, ...points];
    try {
      return await this.fetchDistanceMatrix(coords);
    } catch (error) {
      console.error("OSRM (matriz) indisponível, usando Haversine:", error);
      return buildHaversineMatrix(coords);
    }
  }

  // Trajeto pelas ruas, na ordem recebida. Se o OSRM falhar, usa linha reta e
  // marca o resultado como aproximado.
  async calculateRoute(
    origin: GeoPoint,
    orderedPoints: RoutePoint[],
  ): Promise<RouteMetrics> {
    const coords: GeoPoint[] = [origin, ...orderedPoints];
    try {
      return await this.fetchRoute(coords);
    } catch (error) {
      console.error("OSRM indisponível, usando linha reta (Haversine):", error);
      return buildStraightLineRoute(coords);
    }
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

  private async fetchRoute(points: GeoPoint[]): Promise<RouteMetrics> {
    const coordinates = points.map((p) => `${p.long},${p.lat}`).join(";");
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
  }
}
