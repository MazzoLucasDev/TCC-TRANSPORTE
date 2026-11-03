import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetVanLocationUseCase } from "./GetVanLocationUseCase.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IVanLocationRepository } from "../../domain/repositories/IVanLocationRepository.js";
import { Van } from "../../domain/entities/van/Van.js";
import { Student } from "../../domain/entities/student/Student.js";
import {
  LOCATION_MAX_AGE_MS,
  VanLocation,
} from "../../domain/entities/van/VanLocation.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import { NotVanMemberError } from "../shared/NotVanMemberError.js";

describe("GetVanLocationUseCase", () => {
  let vanRepository: IVanRepository;
  let studentRepository: IStudentRepository;
  let vanLocationRepository: IVanLocationRepository;
  let sut: GetVanLocationUseCase;
  let van: Van;
  let student: Student;

  const DRIVER_ID = "driver-1";

  const buildLocation = (updatedAt?: Date) => {
    const result = VanLocation.create(
      { vanId: van.id, lat: -22.9, long: -49.87 },
      updatedAt,
    );
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    return result.value;
  };

  beforeEach(() => {
    const vanResult = Van.create({
      model: "Sprinter",
      year: 2022,
      period: "MANHA",
      destiny: "Colégio X",
      capacity: 15,
      driverId: DRIVER_ID,
    });
    if (vanResult.isLeft()) throw new Error("Falha ao montar fixture");
    van = vanResult.value.alterarStatusTrajeto(true);

    const studentResult = Student.create({
      userId: "user-1",
      dateOfBirth: "2010-03-20",
      coordinates: { lat: -25.42, long: -49.27 },
    });
    if (studentResult.isLeft()) throw new Error("Falha ao montar fixture");
    student = studentResult.value.linkToVan(van.id);

    vanRepository = {
      findById: vi.fn().mockResolvedValue(van),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      listDriverVans: vi.fn(),
      delete: vi.fn(),
    };

    studentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn().mockResolvedValue(student),
      listByVanId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    vanLocationRepository = {
      save: vi.fn(),
      findByVanId: vi.fn().mockResolvedValue(buildLocation()),
      delete: vi.fn(),
    };

    sut = GetVanLocationUseCase.create(
      vanRepository,
      studentRepository,
      vanLocationRepository,
    );
  });

  it("deve devolver a posição atual para o motorista dono", async () => {
    const result = await sut.execute({ vanId: van.id, requesterId: DRIVER_ID });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.vanId).toBe(van.id);
      expect(result.value.emTrajeto).toBe(true);
      expect(result.value.location).toMatchObject({
        lat: -22.9,
        long: -49.87,
        stale: false,
      });
    }
  });

  it("deve devolver a posição para um aluno vinculado à van", async () => {
    const result = await sut.execute({ vanId: van.id, requesterId: "user-1" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.location?.lat).toBe(-22.9);
    }
    expect(studentRepository.findByUserId).toHaveBeenCalledWith("user-1");
  });

  it("não deve consultar o aluno quando quem pede é o motorista dono", async () => {
    await sut.execute({ vanId: van.id, requesterId: DRIVER_ID });

    expect(studentRepository.findByUserId).not.toHaveBeenCalled();
  });

  it("deve marcar a posição como sem sinal quando está antiga demais", async () => {
    const old = new Date(Date.now() - LOCATION_MAX_AGE_MS - 5_000);
    vanLocationRepository.findByVanId = vi
      .fn()
      .mockResolvedValue(buildLocation(old));

    const result = await sut.execute({ vanId: van.id, requesterId: "user-1" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.location?.stale).toBe(true);
    }
  });

  it("deve devolver location nula quando a van ainda não enviou posição", async () => {
    vanLocationRepository.findByVanId = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({ vanId: van.id, requesterId: "user-1" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.emTrajeto).toBe(true);
      expect(result.value.location).toBeNull();
    }
  });

  it("deve devolver location nula e não consultar a posição quando a van não está em trajeto", async () => {
    vanRepository.findById = vi
      .fn()
      .mockResolvedValue(van.alterarStatusTrajeto(false));

    const result = await sut.execute({ vanId: van.id, requesterId: "user-1" });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.emTrajeto).toBe(false);
      expect(result.value.location).toBeNull();
    }
    expect(vanLocationRepository.findByVanId).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando a van não existe", async () => {
    vanRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      vanId: "inexistente",
      requesterId: "user-1",
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(VanNotFoundError);
    }
  });

  it("deve rejeitar um aluno vinculado a outra van", async () => {
    studentRepository.findByUserId = vi
      .fn()
      .mockResolvedValue(student.linkToVan("outra-van"));

    const result = await sut.execute({ vanId: van.id, requesterId: "user-1" });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotVanMemberError);
    }
    expect(vanLocationRepository.findByVanId).not.toHaveBeenCalled();
  });

  it("deve rejeitar um aluno sem van", async () => {
    const unlinked = Student.create({
      userId: "user-1",
      dateOfBirth: "2010-03-20",
      coordinates: { lat: -25.42, long: -49.27 },
    });
    if (unlinked.isLeft()) throw new Error("Falha ao montar fixture");
    studentRepository.findByUserId = vi.fn().mockResolvedValue(unlinked.value);

    const result = await sut.execute({ vanId: van.id, requesterId: "user-1" });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotVanMemberError);
    }
  });

  it("deve rejeitar um usuário que não é motorista dono nem aluno", async () => {
    studentRepository.findByUserId = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      vanId: van.id,
      requesterId: "outro-motorista",
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotVanMemberError);
    }
    expect(vanLocationRepository.findByVanId).not.toHaveBeenCalled();
  });
});
