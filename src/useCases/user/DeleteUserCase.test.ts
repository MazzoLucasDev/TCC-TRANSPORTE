import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteUserUseCase } from "./DeleteUserCase";
import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import type { IDriverRepository } from "../../domain/repositories/IDriverRepository";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository";
import type { IVanRepository } from "../../domain/repositories/IVanRepository";
import { User } from "../../domain/entities/user/User";
import { Driver } from "../../domain/entities/driver/Driver";
import { Student } from "../../domain/entities/student/Student";
import { Van } from "../../domain/entities/van/Van";

describe("DeleteUserUseCase", () => {
  let userRepository: IUserRepository;
  let driverRepository: IDriverRepository;
  let studentRepository: IStudentRepository;
  let vanRepository: IVanRepository;
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

    vanRepository = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      listAll: vi.fn(),
      listDriverVans: vi.fn().mockResolvedValue([]), // sem vans, por padrão
      delete: vi.fn(),
    };

    sut = DeleteUserUseCase.create(
      userRepository,
      driverRepository,
      studentRepository,
      vanRepository,
    );
  });

  it("deve deletar um motorista sem vans e seu registro de Driver correspondente", async () => {
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

  it("deve rejeitar deletar motorista que ainda possui vans cadastradas", async () => {
    userRepository.findById = vi.fn().mockResolvedValue(driverUser);

    const vanResult = Van.create({
      model: "Sprinter",
      year: 2022,
      period: "MANHA",
      destiny: "Colégio X",
      capacity: 15,
      driverId: driverUser.id,
    });
    if (vanResult.isLeft()) throw new Error("Falha ao montar fixture de van");
    vanRepository.listDriverVans = vi.fn().mockResolvedValue([vanResult.value]);

    const result = await sut.execute({ id: driverUser.id });

    expect(result.isLeft()).toBe(true);
    expect(driverRepository.delete).not.toHaveBeenCalled();
    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  it("deve deletar um aluno e seu registro de Student correspondente, sem checar vans", async () => {
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
    expect(vanRepository.listDriverVans).not.toHaveBeenCalled();
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
