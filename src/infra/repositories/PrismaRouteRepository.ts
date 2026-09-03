import { Route } from "../../domain/entities/route/Route.js";
import type { IRouteRepository } from "../../domain/repositories/IRouteRepository.js";
import { prismaClient } from "../database/prismaClient.js";

export class PrismaRouteRepository implements IRouteRepository {
  async findById(id: string): Promise<Route | null> {
    const row = await prismaClient.routeModel.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async listByVanAndDate(vanId: string, date: Date): Promise<Route[]> {
    const rows = await prismaClient.routeModel.findMany({
      where: { vanId, date },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(route: Route): Promise<void> {
    const data = route.toPersistence();
    await prismaClient.routeModel.create({ data });
  }

  async listAll(): Promise<Route[]> {
    const rows = await prismaClient.routeModel.findMany();
    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await prismaClient.routeModel.delete({ where: { id } });
  }
  async deleteByVanId(vanId: string): Promise<void> {
    await prismaClient.routeModel.deleteMany({ where: { vanId } });
  }

  private toDomain(row: {
    id: string;
    vanId: string;
    date: Date;
    type: string;
    studentOrder: string[];
    distanceKm: number;
    durationMin: number;
  }): Route {
    return Route.reconstitute({
      id: row.id,
      vanId: row.vanId,
      date: row.date,
      type: row.type,
      studentOrder: row.studentOrder,
      distanceKm: row.distanceKm,
      durationMin: row.durationMin,
    });
  }
}
