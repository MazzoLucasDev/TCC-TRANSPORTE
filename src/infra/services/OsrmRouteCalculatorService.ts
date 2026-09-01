import type {
  IRouteCalculatorService,
  RouteCalculatorResult,
  RoutePoint,
} from "../../domain/services/IRouteCalculatorService.js";

const OSRM_BASE_URL = "https://router.project-osrm.org";

type OsrmPoint = { lat: number; long: number };

export class OsrmRouteCalculatorService implements IRouteCalculatorService {
  async calculateFixedOrder(
    origin: { lat: number; long: number },
    points: RoutePoint[],
  ): Promise<RouteCalculatorResult> {
    const order = points.map((p) => p.studentId);
    const coordinates = [origin, ...points];

    const { distanceKm, durationMin } = await this.fetchRoute(coordinates);

    return { order, distanceKm, durationMin };
  }

  async calculateOptimized(
    origin: { lat: number; long: number },
    points: RoutePoint[],
  ): Promise<RouteCalculatorResult> {
    const remaining = [...points];
    const order: string[] = [];
    const orderedCoordinates: OsrmPoint[] = [origin];
    let currentPoint: OsrmPoint = origin;

    // 1ª etapa: decide a ORDEM usando Haversine (rápido, sem custo de rede por ponto)
    while (remaining.length > 0) {
      const firstPoint = remaining[0];
      if (!firstPoint) break;

      let nearestIndex = 0;
      let nearestDistance = this.haversineDistance(currentPoint, firstPoint);

      for (let i = 1; i < remaining.length; i++) {
        const candidate = remaining[i];
        if (!candidate) continue;

        const distance = this.haversineDistance(currentPoint, candidate);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
      const nearest = remaining.splice(nearestIndex, 1)[0];
      if (!nearest) break;

      order.push(nearest.studentId);
      orderedCoordinates.push(nearest);
      currentPoint = nearest;
    }
    const { distanceKm, durationMin } =
      await this.fetchRoute(orderedCoordinates);
    return { order, distanceKm, durationMin };
  }

  private async fetchRoute(
    points: OsrmPoint[],
  ): Promise<{ distanceKm: number; durationMin: number }> {
    const coordinatesParam = points.map((p) => `${p.long}, ${p.lat}`).join(";");
    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinatesParam}?overview=false`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Falha ao consultar OSRM: ${response.status}`);
    }

    const data = await response.json();
    const route = data.routes?.[0];

    if (!route) {
      throw new Error("OSRM não retornou nenhuma rota válida");
    }

    return {
      distanceKm: route.distance / 1000, // OSRM retorna em metros
      durationMin: route.duration / 60, // OSRM retorna em segundos
    };
  }
  private haversineDistance(a: OsrmPoint, b: OsrmPoint): number {
    const R = 6371;
    const dLat = this.toRad(b.lat - a.lat);
    const dLong = this.toRad(b.long - a.long);

    const sinLat = Math.sin(dLat / 2);
    const sinLong = Math.sin(dLong / 2);

    const h =
      sinLat * sinLat +
      Math.cos(this.toRad(a.lat)) *
        Math.cos(this.toRad(b.lat)) *
        sinLong *
        sinLong;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

    return R * c;
  }
  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
