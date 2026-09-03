import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteVanUseCase } from "./DeleteVanUseCase";
import type { IVanRepository } from "../../domain/repositories/IVanRepository";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository";
import type { IRouteRepository } from "../../domain/repositories/IRouteRepository";
import { Van } from "../../domain/entities/van/Van";
import { Student } from "../../domain/entities/student/Student";

describe("DeleteVanUseCase", () => {
  let vanRepository: IVanRepository;
  let studentRepository: IStudentRepository;
  let routeRepository: IRouteRepository;
  let sut: DeleteVanUseCase;
  let van: Van;

  const DRIVER_ID = "driver-1";

  const buildStudent = (vanId: string) => {
    const result = Student.create({
      userId: "user-x",
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    return result.value.linkToVan(vanId);
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
    if (vanResult.isLeft()) throw new Error("Falha ao montar van");
    van = vanResult.value;

    vanRepository = {
      findById: vi.fn().mockResolvedValue(van),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      listDriverVans: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    studentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      listByVanId: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    routeRepository = {
      findById: vi.fn(),
      listByVanAndDate: vi.fn(),
      create: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
      deleteByVanId: vi.fn().mockResolvedValue(undefined),
    };

    sut = DeleteVanUseCase.create(
      vanRepository,
      studentRepository,
      routeRepository,
    );
  });

  it("deve deletar a van com sucesso quando o requester é o dono", async () => {
    const result = await sut.execute({ id: van.id, requesterId: DRIVER_ID });

    expect(result.isRight()).toBe(true);
    expect(vanRepository.delete).toHaveBeenCalledWith(van.id);
  });

  it("deve desvincular todos os alunos da van antes de deletar", async () => {
    const student1 = buildStudent(van.id);
    const student2 = buildStudent(van.id);
    studentRepository.listByVanId = vi
      .fn()
      .mockResolvedValue([student1, student2]);

    await sut.execute({ id: van.id, requesterId: DRIVER_ID });

    expect(studentRepository.update).toHaveBeenCalledTimes(2);
    const updatedStudents = (studentRepository.update as any).mock.calls.map(
      (c: any) => c[0],
    );
    expect(updatedStudents.every((s: Student) => s.vanId === null)).toBe(true);
  });

  it("deve apagar as rotas da van antes de deletar a van", async () => {
    await sut.execute({ id: van.id, requesterId: DRIVER_ID });

    expect(routeRepository.deleteByVanId).toHaveBeenCalledWith(van.id);
  });

  it("deve rejeitar quando o requester não é o dono da van", async () => {
    const result = await sut.execute({
      id: van.id,
      requesterId: "outro-motorista",
    });

    expect(result.isLeft()).toBe(true);
    expect(vanRepository.delete).not.toHaveBeenCalled();
    expect(routeRepository.deleteByVanId).not.toHaveBeenCalled();
  });

  it("deve rejeitar quando a van não existe", async () => {
    vanRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({
      id: "inexistente",
      requesterId: DRIVER_ID,
    });

    expect(result.isLeft()).toBe(true);
    expect(vanRepository.delete).not.toHaveBeenCalled();
  });
});
