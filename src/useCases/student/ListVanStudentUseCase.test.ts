import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListVanStudentUseCase } from "./ListVanStudentUseCase.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import { Student } from "../../domain/entities/student/Student.js";

describe("ListVanStudentUseCase", () => {
  let studentRepository: IStudentRepository;
  let sut: ListVanStudentUseCase;

  const buildStudent = () => {
    const result = Student.create({
      userId: "user-1",
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (result.isLeft()) throw new Error("Falha ao montar fixture");
    return result.value;
  };

  beforeEach(() => {
    studentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      listByVanId: vi.fn().mockResolvedValue([buildStudent(), buildStudent()]),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn(),
    };

    sut = ListVanStudentUseCase.create(studentRepository);
  });

  it("deve listar os alunos vinculados à van", async () => {
    const result = await sut.execute({ vanId: "van-1" });

    expect(result.students).toHaveLength(2);
    expect(result.students[0]).toEqual({
      id: expect.any(String),
      userId: "user-1",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
  });

  it("deve retornar lista vazia quando a van não tem alunos", async () => {
    studentRepository.listByVanId = vi.fn().mockResolvedValue([]);

    const result = await sut.execute({ vanId: "van-vazia" });

    expect(result.students).toEqual([]);
  });

  it("deve chamar o repository com o vanId correto", async () => {
    await sut.execute({ vanId: "van-1" });

    expect(studentRepository.listByVanId).toHaveBeenCalledWith("van-1");
  });
});
