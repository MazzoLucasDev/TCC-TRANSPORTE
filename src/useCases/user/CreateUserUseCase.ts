import {
  Driver,
  type DriverError,
} from "../../domain/entities/driver/Driver.js";
import {
  Student,
  type StudentError,
} from "../../domain/entities/student/Student.js";
import { User, type UserError } from "../../domain/entities/user/User.js";
import type { IDriverRepository } from "../../domain/repositories/IDriverRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { IPasswordHasher } from "../../domain/services/IPasswordHasher.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import type { UseCase } from "../useCase.js";
import { DuplicateEmailError } from "./errors/DuplicateEmailError.js";

type CreateUserBaseFields = {
  name: string;
  email: string;
  password: string;
  phone: string;
};

export type CreateUserInputDto = CreateUserBaseFields &
  (
    | {
        userType: "MOTORISTA";
        license: string;
        dateOfBirth: string;
      }
    | {
        userType: "ALUNO";
        dateOfBirth: string;
        collectionPoint: {
          lat: number;
          long: number;
        };
      }
  );

export type CreateUserOutputDto = {
  id: string;
  name: string;
  userType: string;
};

export type CreateUserError =
  | DuplicateEmailError
  | UserError
  | DriverError
  | StudentError;

export class CreateUserUseCase implements UseCase<
  CreateUserInputDto,
  Either<CreateUserError, CreateUserOutputDto>
> {
  private constructor(
    private readonly userRepository: IUserRepository,
    private readonly driverRepository: IDriverRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly passwodHasher: IPasswordHasher,
  ) {}

  public static create(
    userRepository: IUserRepository,
    driverRepository: IDriverRepository,
    studentRepository: IStudentRepository,
    passwodHasher: IPasswordHasher,
  ) {
    return new CreateUserUseCase(
      userRepository,
      driverRepository,
      studentRepository,
      passwodHasher,
    );
  }

  public async execute(
    input: CreateUserInputDto,
  ): Promise<Either<CreateUserError, CreateUserOutputDto>> {
    const existingUser = await this.userRepository.existsByEmail(input.email);
    if (existingUser) {
      return left(new DuplicateEmailError(input.email));
    }

    const hashedPassword = await this.passwodHasher.hash(input.password);

    const userOrError = User.create({
      name: input.name,
      email: input.email,
      password: input.password,
      phone: input.phone,
      userType: input.userType,
    });

    if (userOrError.isLeft()) {
      return left(userOrError.value);
    }
    const user = userOrError.value;

    if (input.userType === "MOTORISTA") {
      const driverOrError = Driver.create({
        userId: user.id,
        license: input.license,
        dateOfBirth: input.dateOfBirth,
      });
      if (driverOrError.isLeft()) {
        return left(driverOrError.value);
      }
      await this.userRepository.create(user);
      await this.driverRepository.create(driverOrError.value);
    } else {
      const studentOrError = Student.create({
        userId: user.id,
        dateOfBirth: input.dateOfBirth,
        collectionPoint: input.collectionPoint,
      });
      if (studentOrError.isLeft()) {
        return left(studentOrError.value);
      }
      await this.userRepository.create(user);
      await this.studentRepository.create(studentOrError.value);
    }
    return right(this.presentOutput(user));
  }

  private presentOutput(user: User): CreateUserOutputDto {
    return {
      id: user.id,
      name: user.name.value,
      userType: user.userType.value,
    };
  }
}
