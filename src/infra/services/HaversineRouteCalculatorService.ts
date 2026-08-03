import type {
  IRouteCalculatorService,
  RouteCalculatorResult,
  RoutePoint,
} from "../../domain/services/IRouteCalculatorService.js";

const AVERAGE_SPEED_KMH = 30;

export class HaversineRouteCalculatorService implements IRouteCalculatorService {
  calculateFixedOrder(
    origin: { lat: number; long: number },
    points: RoutePoint[],
  ): RouteCalculatorResult {
    const order = points.map((p) => p.studentId);
    const distanceKm = this.calculateTotalDistance(origin, points);
    return {
      order,
      distanceKm,
      durationMin: this.distanceToMinutes(distanceKm),
    };
  }
  calculateOptimized(
    origin: { lat: number; long: number },
    points: RoutePoint[],
  ): RouteCalculatorResult {
    const remaining = [...points];
    const order: string[] = [];
    let currentPoint = origin;
    let totalDistance = 0;

    while (remaining.length > 0) {
      const firstPoint = remaining[0];
      if (!firstPoint) {
        break;
      }
      let nearestIndex = 0;
      let nearestDistance = this.haversineDistance(currentPoint, firstPoint);

      for (let i = 1; i < remaining.length; i++) {
        const candidate = remaining[i];
        if (!candidate) {
          continue;
        }
        const distance = this.haversineDistance(currentPoint, candidate);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
      const nearest = remaining.splice(nearestIndex, 1)[0];
      if (!nearest) {
        break;
      }

      order.push(nearest.studentId);
      totalDistance += nearestDistance;
      currentPoint = nearest;
    }
    return {
      order,
      distanceKm: totalDistance,
      durationMin: this.distanceToMinutes(totalDistance),
    };
  }

  private calculateTotalDistance(
    origin: { lat: number; long: number },
    points: RoutePoint[],
  ): number {
    let total = 0;
    let current = origin;
    for (const point of points) {
      total += this.haversineDistance(current, point);
      current = point;
    }
    return total;
  }

  private haversineDistance(
    a: { lat: number; long: number },
    b: { lat: number; long: number },
  ): number {
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

  private distanceToMinutes(distanceKm: number): number {
    return (distanceKm / AVERAGE_SPEED_KMH) * 60;
  }
}
