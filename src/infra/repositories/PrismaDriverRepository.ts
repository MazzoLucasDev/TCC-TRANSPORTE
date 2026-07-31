import { Driver } from "../../domain/entities/driver/Driver.js";
import type { IDriverRepository } from "../../domain/repositories/IDriverRepository.js";
import { prismaClient } from "../database/prismaClient.js";

export class PrismaDriverRepository implements IDriverRepository {
  async findById(id: string): Promise<Driver | null> {
    const row = await prismaClient.driverModel.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByUserId(userId: string): Promise<Driver | null> {
    const row = await prismaClient.driverModel.findUnique({
      where: { userId },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async create(driver: Driver): Promise<void> {
    const data = driver.toPersistence();
    await prismaClient.driverModel.create({ data });
  }

  async update(driver: Driver): Promise<void> {
    const data = driver.toPersistence();
    await prismaClient.driverModel.update({ where: { id: driver.id }, data });
  }

  async listAll(): Promise<Driver[]> {
    const rows = await prismaClient.driverModel.findMany();
    return rows.map((row: any) => this.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await prismaClient.driverModel.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    userId: string;
    license: string;
    dateOfBirth: Date;
  }): Driver {
    return Driver.reconstitute({
      id: row.id,
      userId: row.userId,
      license: row.license,
      dateOfBirth: row.dateOfBirth,
    });
  }
}
