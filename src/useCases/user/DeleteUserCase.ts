import { User } from "../../domain/entities/user/User.js";
import type { IDriverRepository } from "../../domain/repositories/IDriverRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import type { UseCase } from "../useCase.js";
import { UserHasActiveVansError } from "./errors/UserHasActiveVansError.js";
import { UserNotFoundError } from "./errors/UserNotFoundError.js";

export type DeleteUserInputDto = { id: string };
export type DeleteUserOutputDto = { deleted: boolean };
export type DeleteUserErrors = UserNotFoundError | UserHasActiveVansError;

export class DeleteUserUseCase implements UseCase<
  DeleteUserInputDto,
  Either<DeleteUserErrors, DeleteUserOutputDto>
> {
  private constructor(
    private readonly userRepository: IUserRepository,
    private readonly driverRepository: IDriverRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly vanRepository: IVanRepository,
  ) {}

  public static create(
    userRepository: IUserRepository,
    driverRepository: IDriverRepository,
    studentRepository: IStudentRepository,
    vanRepository: IVanRepository,
  ) {
    return new DeleteUserUseCase(
      userRepository,
      driverRepository,
      studentRepository,
      vanRepository,
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
      const vans = await this.vanRepository.listDriverVans(user.id);
      if (vans.length > 0) {
        return left(new UserHasActiveVansError(user.id));
      }
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
