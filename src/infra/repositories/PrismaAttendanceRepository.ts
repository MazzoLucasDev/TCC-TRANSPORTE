import { Attendance } from "../../domain/entities/attendance/Attendance.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import { prismaClient } from "../database/prismaClient.js";

export class PrismaAttendanceRepository implements IAttendanceRepository {
  async findById(id: string): Promise<Attendance | null> {
    const row = await prismaClient.attendanceModel.findUnique({
      where: { id },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByStudentAndDate(
    studentId: string,
    date: Date,
  ): Promise<Attendance | null> {
    const row = await prismaClient.attendanceModel.findUnique({
      where: { studentId_date: { studentId, date } },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async listByVanAndDate(vanId: string, date: Date): Promise<Attendance[]> {
    const rows = await prismaClient.attendanceModel.findMany({
      where: {
        date,
        student: { vanId },
      },
    });
    return rows.map((row: any) => this.toDomain(row));
  }

  async create(attendence: Attendance): Promise<void> {
    const data = attendence.toPersistence();
    await prismaClient.attendanceModel.create({ data });
  }

  async update(attendence: Attendance): Promise<void> {
    const data = attendence.toPersistence();
    await prismaClient.attendanceModel.update({
      where: { id: attendence.id },
      data,
    });
  }

  async listAll(): Promise<Attendance[]> {
    const rows = await prismaClient.attendanceModel.findMany();
    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await prismaClient.attendanceModel.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    studentId: string;
    date: Date;
    status: string;
  }): Attendance {
    return Attendance.reconstitute({
      id: row.id,
      studentId: row.studentId,
      date: row.date,
      status: row.status,
    });
  }
}
