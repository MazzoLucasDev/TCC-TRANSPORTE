export type GeoPoint = { lat: number; long: number };

export type RoutePoint = {
  studentId: string;
  lat: number;
  long: number;
};

export type RouteCalculatorResult = {
  order: string[]; // ordem dos alunos
  distanceKm: number;
  durationMin: number;
  geometry: GeoPoint[]; // trajeto pelas ruas, da origem até a última parada
  approximate: boolean;
};

export interface IRouteCalculatorService {
  calculateFixedOrder(
    origin: { lat: number; long: number },
    points: RoutePoint[],
  ): Promise<RouteCalculatorResult>;

  calculateOptimized(
    origin: { lat: number; long: number },
    points: RoutePoint[],
  ): Promise<RouteCalculatorResult>;
}
