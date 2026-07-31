import { describe, it, expect, afterEach, afterAll, beforeAll } from "vitest";
import { PrismaStudentRepository } from "./PrismaStudentRepository.js";
import { PrismaUserRepository } from "./PrismaUserRepository.js";
import { PrismaVanRepository } from "./PrismaVanRepository.js";
import { Student } from "../../domain/entities/student/Student.js";
import { User } from "../../domain/entities/user/User.js";
import { Van } from "../../domain/entities/van/Van.js";
import { prismaClient } from "../database/prismaClient.js";

describe("PrismaStudentRepository (integração)", () => {
  const sut = new PrismaStudentRepository();
  const userRepository = new PrismaUserRepository();
  const vanRepository = new PrismaVanRepository();
  const createdStudentIds: string[] = [];
  let studentUserId: string;
  let driverUserId: string;
  let vanId: string;

  beforeAll(async () => {
    const studentUserResult = User.create({
      name: "Aluno Teste",
      email: `aluno-test-${crypto.randomUUID()}@email.com`,
      password: "Senha123",
      phone: "41999999999",
      userType: "ALUNO",
    });
    if (studentUserResult.isLeft())
      throw new Error("Falha ao montar user aluno");
    await userRepository.create(studentUserResult.value);
    studentUserId = studentUserResult.value.id;

    const driverUserResult = User.create({
      name: "Motorista Teste",
      email: `motorista-student-test-${crypto.randomUUID()}@email.com`,
      password: "Senha123",
      phone: "41988888888",
      userType: "MOTORISTA",
    });
    if (driverUserResult.isLeft())
      throw new Error("Falha ao montar user motorista");
    await userRepository.create(driverUserResult.value);
    driverUserId = driverUserResult.value.id;

    const vanResult = Van.create({
      model: "Sprinter",
      year: 2022,
      period: "MANHA",
      destiny: "Colégio X",
      capacity: 15,
      driverId: driverUserId,
    });
    if (vanResult.isLeft()) throw new Error("Falha ao montar van");
    await vanRepository.create(vanResult.value);
    vanId = vanResult.value.id;
  });

  afterEach(async () => {
    for (const id of createdStudentIds) {
      await prismaClient.studentModel.delete({ where: { id } }).catch(() => {});
    }
    createdStudentIds.length = 0;
  });

  afterAll(async () => {
    await prismaClient.vanModel
      .delete({ where: { id: vanId } })
      .catch(() => {});
    await prismaClient.userModel
      .delete({ where: { id: driverUserId } })
      .catch(() => {});
    await prismaClient.userModel
      .delete({ where: { id: studentUserId } })
      .catch(() => {});
  });

  const buildStudent = () => {
    const result = Student.create({
      userId: studentUserId,
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    return result.value;
  };

  it("deve criar e encontrar um aluno pelo id, preservando o ponto de coleta", async () => {
    const student = buildStudent();
    createdStudentIds.push(student.id);

    await sut.create(student);
    const found = await sut.findById(student.id);

    expect(found).not.toBeNull();
    expect(found?.collectionPoint.value).toEqual({ lat: -25.42, long: -49.27 });
  });

  it("deve encontrar um aluno pelo userId", async () => {
    const student = buildStudent();
    createdStudentIds.push(student.id);
    await sut.create(student);

    const found = await sut.findByUserId(studentUserId);

    expect(found?.id).toBe(student.id);
  });

  it("deve vincular o aluno a uma van e listar por vanId", async () => {
    const student = buildStudent();
    createdStudentIds.push(student.id);
    await sut.create(student);

    const linked = student.linkToVan(vanId);
    await sut.update(linked);

    const studentsInVan = await sut.listByVanId(vanId);

    expect(studentsInVan.map((s) => s.id)).toContain(student.id);
    expect(studentsInVan[0]?.vanId).toBe(vanId);
  });

  it("deve deletar um aluno", async () => {
    const student = buildStudent();
    await sut.create(student);

    await sut.delete(student.id);

    const found = await sut.findById(student.id);
    expect(found).toBeNull();
  });
});
