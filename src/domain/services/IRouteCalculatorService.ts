export type GeoPoint = { lat: number; long: number };

export type RoutePoint = {
  studentId: string;
  lat: number;
  long: number;
};

// Distância, tempo e traçado de um percurso que passa pelas paradas na ordem recebida.
export type RouteMetrics = {
  distanceKm: number;
  durationMin: number;
  geometry: GeoPoint[]; // traçado, da origem até a última parada
  approximate: boolean;
};

// O serviço só fornece distâncias e traçados. A escolha da ordem das paradas
// é regra de negócio e fica no domínio (orderByNearestNeighbor) e no caso de uso.
export interface IRouteCalculatorService {
  // Matriz de distâncias em km. Índice 0 = origem; 1..n = paradas, na ordem recebida.
  getDistanceMatrix(
    origin: GeoPoint,
    points: RoutePoint[],
  ): Promise<number[][]>;

  // Percurso que parte da origem e visita as paradas na ordem recebida.
  calculateRoute(
    origin: GeoPoint,
    orderedPoints: RoutePoint[],
  ): Promise<RouteMetrics>;
}
