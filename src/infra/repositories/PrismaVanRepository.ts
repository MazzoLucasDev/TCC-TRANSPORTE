import { Van } from "../../domain/entities/van/Van.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { prismaClient } from "../database/prismaClient.js";

export class PrismaVanRepository implements IVanRepository {
  async create(van: Van): Promise<void> {
    const data = van.toPersistence();
    await prismaClient.vanModel.create({ data });
  }

  async update(van: Van): Promise<void> {
    const data = van.toPersistence();
    await prismaClient.vanModel.update({
      where: { id: data.id },
      data,
    });
  }

  async listAll(): Promise<Van[]> {
    const rows = await prismaClient.vanModel.findMany();
    return rows.map((row: any) => this.toDomain(row));
  }

  async listDriverVans(driverId: string): Promise<Van[]> {
    const rows = await prismaClient.vanModel.findMany({ where: { driverId } });
    return rows.map((row: any) => this.toDomain(row));
  }

  async findById(id: string): Promise<Van | null> {
    const row = await prismaClient.vanModel.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await prismaClient.vanModel.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    model: string;
    year: number;
    period: string;
    destiny: string;
    capacity: number;
    driverId: string;
    emTrajeto: boolean;
  }): Van {
    return Van.reconstitute({
      id: row.id,
      model: row.model,
      year: row.year,
      period: row.period,
      destiny: row.destiny,
      capacity: row.capacity,
      driverId: row.driverId,
      emTrajeto: row.emTrajeto,
    });
  }
}
