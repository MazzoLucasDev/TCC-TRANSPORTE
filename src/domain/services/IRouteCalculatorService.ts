export type RoutePoint = {
  studentId: string;
  lat: number;
  long: number;
};

export type RouteCalculatorResult = {
  order: string[]; // ordem dos alunos
  distanceKm: number;
  durationMin: number;
};

export interface IRouteCalculatorService {
  calculateFixedOrder(
    origin: { lat: number; long: number },
    points: RoutePoint[],
  ): RouteCalculatorResult;

  calculateOptimized(
    origin: { lat: number; long: number },
    points: RoutePoint[],
  ): RouteCalculatorResult;
}
