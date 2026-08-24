import { InvalidNameError } from "../../domain/entities/user/errors/InvalidNameError.js";
import type { InvalidPhoneError } from "../../domain/entities/user/errors/InvalidPhoneError.js";
import { User } from "../../domain/entities/user/User.js";
import { Name } from "../../domain/entities/user/valueObjects/Name.js";
import { Phone } from "../../domain/entities/user/valueObjects/Phone.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import type { UseCase } from "../useCase.js";
import { UserNotFoundError } from "./errors/UserNotFoundError.js";

export type UpdateUserInputDto = {
  userId: string;
  name: string;
  phone: string;
};
export type UpdateUserOutputDto = {
  id: string;
  name: string;
  phone: string;
};

export type UpdateUserError =
  | UserNotFoundError
  | InvalidNameError
  | InvalidPhoneError;

export class UpdateUserUseCase implements UseCase<
  UpdateUserInputDto,
  Either<UpdateUserError, UpdateUserOutputDto>
> {
  private constructor(private readonly userRepository: IUserRepository) {}

  public static create(userRepository: IUserRepository) {
    return new UpdateUserUseCase(userRepository);
  }

  public async execute(
    input: UpdateUserInputDto,
  ): Promise<Either<UpdateUserError, UpdateUserOutputDto>> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      return left(new UserNotFoundError(input.userId));
    }

    const nameOrError = Name.create(input.name);
    if (nameOrError.isLeft()) {
      return left(nameOrError.value);
    }

    const phoneOrError = Phone.create(input.phone);
    if (phoneOrError.isLeft()) {
      return left(phoneOrError.value);
    }

    const updatedUser = user.withUpdatedContactInfo(
      nameOrError.value,
      phoneOrError.value,
    );

    await this.userRepository.update(updatedUser);

    return right(this.presentOutput(updatedUser));
  }

  private presentOutput(user: User): UpdateUserOutputDto {
    return { id: user.id, name: user.name.value, phone: user.phone.value };
  }
}
