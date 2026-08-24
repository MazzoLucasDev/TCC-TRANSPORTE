import { User } from "../../domain/entities/user/User.js";
import type { IDriverRepository } from "../../domain/repositories/IDriverRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import type { UseCase } from "../useCase.js";
import { UserNotFoundError } from "./errors/UserNotFoundError.js";

export type DeleteUserInputDto = { id: string };
export type DeleteUserOutputDto = { deleted: boolean };
export type DeleteUserErrors = UserNotFoundError;

export class DeleteUserUseCase implements UseCase<
  DeleteUserInputDto,
  Either<DeleteUserErrors, DeleteUserOutputDto>
> {
  private constructor(
    private readonly userRepository: IUserRepository,
    private readonly driverRepository: IDriverRepository,
    private readonly studentRepository: IStudentRepository,
  ) {}

  public static create(
    userRepository: IUserRepository,
    driverRepository: IDriverRepository,
    studentRepository: IStudentRepository,
  ) {
    return new DeleteUserUseCase(
      userRepository,
      driverRepository,
      studentRepository,
    );
  }

  public async execute(
    input: DeleteUserInputDto,
  ): Promise<Either<UserNotFoundError, DeleteUserOutputDto>> {
    const user = await this.userRepository.findById(input.id);
    if (!user) {
      return left(new UserNotFoundError(input.id));
    }

    if (user.userType.isMotorista()) {
      const driver = await this.driverRepository.findByUserId(user.id);
      if (driver) await this.driverRepository.delete(driver.id);
    } else {
      const student = await this.studentRepository.findByUserId(user.id);
      if (student) await this.studentRepository.delete(student.id);
    }

    await this.userRepository.delete(user.id);
    return right({ deleted: true });
  }
}
