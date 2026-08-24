import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteUserUseCase } from "./DeleteUserCase";
import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import type { IDriverRepository } from "../../domain/repositories/IDriverRepository";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository";
import { User } from "../../domain/entities/user/User";
import { Driver } from "../../domain/entities/driver/Driver";
import { Student } from "../../domain/entities/student/Student";

describe("DeleteUserUseCase", () => {
  let userRepository: IUserRepository;
  let driverRepository: IDriverRepository;
  let studentRepository: IStudentRepository;
  let sut: DeleteUserUseCase;
  let driverUser: User;
  let studentUser: User;

  beforeEach(() => {
    driverUser = User.reconstitute({
      id: "driver-user-1",
      name: "João Motorista",
      email: "joao@email.com",
      hashedPassword: "hashed-123",
      phone: "41988888888",
      userType: "MOTORISTA",
    });

    studentUser = User.reconstitute({
      id: "student-user-1",
      name: "Ana Aluna",
      email: "ana@email.com",
      hashedPassword: "hashed-123",
      phone: "41999999999",
      userType: "ALUNO",
    });

    userRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    driverRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    studentRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      listByVanId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    sut = DeleteUserUseCase.create(
      userRepository,
      driverRepository,
      studentRepository,
    );
  });

  it("deve deletar um motorista e seu registro de Driver correspondente", async () => {
    userRepository.findById = vi.fn().mockResolvedValue(driverUser);
    const driverResult = Driver.create({
      userId: driverUser.id,
      license: "12345678900",
      dateOfBirth: "1990-05-14",
    });
    if (driverResult.isLeft()) throw new Error("Falha ao montar fixture");
    driverRepository.findByUserId = vi
      .fn()
      .mockResolvedValue(driverResult.value);

    const result = await sut.execute({ id: driverUser.id });

    expect(result.isRight()).toBe(true);
    expect(driverRepository.delete).toHaveBeenCalledWith(driverResult.value.id);
    expect(studentRepository.delete).not.toHaveBeenCalled();
    expect(userRepository.delete).toHaveBeenCalledWith(driverUser.id);
  });

  it("deve deletar um aluno e seu registro de Student correspondente", async () => {
    userRepository.findById = vi.fn().mockResolvedValue(studentUser);
    const studentResult = Student.create({
      userId: studentUser.id,
      dateOfBirth: "2010-03-20",
      collectionPoint: { lat: -25.42, long: -49.27 },
    });
    if (studentResult.isLeft()) throw new Error("Falha ao montar fixture");
    studentRepository.findByUserId = vi
      .fn()
      .mockResolvedValue(studentResult.value);

    const result = await sut.execute({ id: studentUser.id });

    expect(result.isRight()).toBe(true);
    expect(studentRepository.delete).toHaveBeenCalledWith(
      studentResult.value.id,
    );
    expect(driverRepository.delete).not.toHaveBeenCalled();
    expect(userRepository.delete).toHaveBeenCalledWith(studentUser.id);
  });

  it("deve rejeitar quando o usuário não existe", async () => {
    userRepository.findById = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({ id: "inexistente" });

    expect(result.isLeft()).toBe(true);
    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  it("não deve tentar deletar Driver/Student se nenhum registro correspondente for encontrado", async () => {
    userRepository.findById = vi.fn().mockResolvedValue(driverUser);
    driverRepository.findByUserId = vi.fn().mockResolvedValue(null);

    const result = await sut.execute({ id: driverUser.id });

    expect(result.isRight()).toBe(true);
    expect(driverRepository.delete).not.toHaveBeenCalled();
    expect(userRepository.delete).toHaveBeenCalledWith(driverUser.id);
  });
});
