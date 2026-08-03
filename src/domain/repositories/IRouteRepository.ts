import type { Route } from "../entities/route/Route.js";

export interface IRouteRepository {
  findById(id: string): Promise<Route | null>;
  listByVanAndDate(vanId: string, date: Date): Promise<Route[]>;
  create(route: Route): Promise<void>;
  listAll(): Promise<Route[]>;
  delete(id: string): Promise<void>;
}
