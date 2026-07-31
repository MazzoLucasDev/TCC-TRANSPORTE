import { User } from "../../domain/entities/user/User.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { prismaClient } from "../database/prismaClient.js";

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await prismaClient.userModel.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await prismaClient.userModel.findUnique({ where: { email } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async create(user: User): Promise<void> {
    const data = user.toPersistence();
    await prismaClient.userModel.create({ data });
  }

  async update(user: User): Promise<void> {
    const data = user.toPersistence();
    await prismaClient.userModel.update({
      where: { id: data.id },
      data,
    });
  }

  async listAll(): Promise<User[]> {
    const rows = await prismaClient.userModel.findMany();
    return rows.map((row: any) => this.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await prismaClient.userModel.delete({ where: { id } });
  }

  private toDomain(row: {
    id: string;
    name: string;
    email: string;
    password: string;
    phone: string;
    userType: string;
  }): User {
    return User.reconstitute({
      id: row.id,
      name: row.name,
      email: row.email,
      hashedPassword: row.password,
      phone: row.phone,
      userType: row.userType,
    });
  }
}
