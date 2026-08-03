import { describe, it, expect, afterEach, afterAll, beforeAll } from "vitest";
import { PrismaAttendanceRepository } from "./PrismaAttendanceRepository.js";
import { PrismaUserRepository } from "./PrismaUserRepository.js";
import { PrismaStudentRepository } from "./PrismaStudentRepository.js";
import { PrismaVanRepository } from "./PrismaVanRepository.js";
import { Attendance } from "../../domain/entities/attendance/Attendance.js";
import { User } from "../../domain/entities/user/User.js";
import { Student } from "../../domain/entities/student/Student.js";
import { Van } from "../../domain/entities/van/Van.js";
import { prismaClient } from "../database/prismaClient.js";

describe("PrismaAttendanceRepository (integração)", () => {
  const sut = new PrismaAttendanceRepository();
  const userRepository = new PrismaUserRepository();
  const studentRepository = new PrismaStudentRepository();
  const vanRepository = new PrismaVanRepository();
  const createdAttendanceIds: string[] = [];
  let studentId: string;
  let vanId: string;
  let studentUserId: string;
  let driverUserId: string;

  beforeAll(async () => {
    const studentUserResult = User.create({
      name: "Aluno Teste",
      email: `aluno-attendance-test-${crypto.randomUUID()}@email.com`,
      password: "Senha123",
      phone: "41999999999",
      userType: "ALUNO",
    });
    if (studentUserResult.isLeft()) throw new Error("Falha aluno");
    await userRepository.create(studentUserResult.value);
    studentUserId = studentUserResult.value.id;

    const driverUserResult = User.create({
      name: "Motorista Teste",
      email: `motorista-attendance-test-${crypto.randomUUID()}@email.com`,
      password: "Senha123",
      phone: "41988888888",
      userType: "MOTORISTA",
    });
    if (driverUserResult.isLeft()) throw new Error("Falha motorista");
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
    if (vanResult.isLeft()) throw new Error("Falha van");
    await vanRepository.create(vanResult.value);
    vanId = vanResult.value.id;

    const studentResult = Student.create({
      userId: studentUserId,
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (studentResult.isLeft()) throw new Error("Falha student");
    const linkedStudent = studentResult.value.linkToVan(vanId);
    await studentRepository.create(linkedStudent);
    studentId = linkedStudent.id;
  });

  afterEach(async () => {
    for (const id of createdAttendanceIds) {
      await prismaClient.attendanceModel
        .delete({ where: { id } })
        .catch(() => {});
    }
    createdAttendanceIds.length = 0;
  });

  afterAll(async () => {
    await prismaClient.studentModel
      .delete({ where: { id: studentId } })
      .catch(() => {});
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

  it("deve criar e encontrar presença por aluno e data", async () => {
    const result = Attendance.create({
      studentId,
      date: "2026-08-01",
      status: "ABSENT",
    });
    if (result.isLeft()) throw new Error("Falha fixture");
    createdAttendanceIds.push(result.value.id);

    await sut.create(result.value);

    const found = await sut.findByStudentAndDate(
      studentId,
      new Date("2026-08-01"),
    );

    expect(found).not.toBeNull();
    expect(found?.status).toBe("ABSENT");
  });

  it("deve listar ausências por van e data", async () => {
    const result = Attendance.create({
      studentId,
      date: "2026-08-02",
      status: "ABSENT",
    });
    if (result.isLeft()) throw new Error("Falha fixture");
    createdAttendanceIds.push(result.value.id);
    await sut.create(result.value);

    const found = await sut.listByVanAndDate(vanId, new Date("2026-08-02"));

    expect(found.length).toBe(1);
    expect(found[0]?.studentId).toBe(studentId);
  });

  it("deve retornar null quando não há registro para aluno e data", async () => {
    const found = await sut.findByStudentAndDate(
      studentId,
      new Date("2099-01-01"),
    );
    expect(found).toBeNull();
  });
});
