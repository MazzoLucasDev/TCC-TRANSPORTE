import type {
  GeoPoint,
  IRouteCalculatorService,
  RouteMetrics,
  RoutePoint,
} from "../../domain/services/IRouteCalculatorService.js";
import { buildHaversineMatrix, buildStraightLineRoute } from "./haversine.js";

export class HaversineRouteCalculatorService implements IRouteCalculatorService {
  async getDistanceMatrix(
    origin: GeoPoint,
    points: RoutePoint[],
  ): Promise<number[][]> {
    return buildHaversineMatrix([origin, ...points]);
  }

  async calculateRoute(
    origin: GeoPoint,
    orderedPoints: RoutePoint[],
  ): Promise<RouteMetrics> {
    return buildStraightLineRoute([origin, ...orderedPoints]);
  }
}
