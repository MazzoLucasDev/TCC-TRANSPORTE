import { Student } from "../../domain/entities/student/Student.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import { prismaClient } from "../database/prismaClient.js";

export class PrismaStudentRepository implements IStudentRepository {
  async findById(id: string): Promise<Student | null> {
    const row = await prismaClient.studentModel.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByUserId(userId: string): Promise<Student | null> {
    const row = await prismaClient.studentModel.findUnique({
      where: { userId },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async listByVanId(vanId: string): Promise<Student[]> {
    const rows = await prismaClient.studentModel.findMany({ where: { vanId } });
    return rows.map((row: any) => this.toDomain(row));
  }

  async create(student: Student): Promise<void> {
    const data = student.toPersistence();
    await prismaClient.studentModel.create({ data });
  }

  async update(student: Student): Promise<void> {
    const data = student.toPersistence();
    await prismaClient.studentModel.update({ where: { id: data.id }, data });
  }

  async listAll(): Promise<Student[]> {
    const rows = await prismaClient.studentModel.findMany();
    return rows.map((row: any) => this.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await prismaClient.studentModel.delete({ where: { id } });
  }
  private toDomain(row: {
    id: string;
    userId: string;
    vanId: string | null;
    dateOfBirth: Date;
    lat: number;
    long: number;
  }): Student {
    return Student.reconstitute({
      id: row.id,
      userId: row.userId,
      vanId: row.vanId,
      dateOfBirth: row.dateOfBirth,
      lat: row.lat,
      long: row.long,
    });
  }
}
