import type { User } from "../../domain/entities/user/User.js";
import { UserType } from "../../domain/entities/user/valueObjects/UserType.js";
import type { IDriverRepository } from "../../domain/repositories/IDriverRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { IPasswordHasher } from "../../domain/services/IPasswordHasher.js";
import type { ITokenService } from "../../domain/services/ITokenService.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import type { UseCase } from "../useCase.js";
import { InvalidCredentialsError } from "./errors/InvalidCredentialsError.js";

export type LoginInputDto = {
  email: string;
  password: string;
};

export type LoginOutputDto = {
  token: string;
  user: {
    id: string;
    name: string;
    userType: string;
  };
  roleId: string;
};

export type LoginError = InvalidCredentialsError;

export class LoginUseCase implements UseCase<
  LoginInputDto,
  Either<LoginError, LoginOutputDto>
> {
  private constructor(
    private readonly userRepository: IUserRepository,
    private readonly driverRepository: IDriverRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
  ) {}

  public static create(
    userRepository: IUserRepository,
    driverRepository: IDriverRepository,
    studentRepository: IStudentRepository,
    passwodHasher: IPasswordHasher,
    tokenService: ITokenService,
  ) {
    return new LoginUseCase(
      userRepository,
      driverRepository,
      studentRepository,
      passwodHasher,
      tokenService,
    );
  }

  public async execute(
    input: LoginInputDto,
  ): Promise<Either<LoginError, LoginOutputDto>> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      return left(new InvalidCredentialsError());
    }

    const passwordMatches = await user.checkPassword(
      input.password,
      this.passwordHasher,
    );

    if (!passwordMatches) {
      return left(new InvalidCredentialsError());
    }

    const roleId = user.userType.isMotorista()
      ? (await this.driverRepository.findByUserId(user.id))?.id
      : (await this.studentRepository.findByUserId(user.id))?.id;

    const token = this.tokenService.generate({
      userId: user.id,
      userType: user.userType.value,
    });

    return right(this.presentOutput(user, token, roleId ?? ""));
  }
  private presentOutput(
    user: User,
    token: string,
    roleId: string,
  ): LoginOutputDto {
    return {
      token,
      user: {
        id: user.id,
        name: user.name.value,
        userType: user.userType.value,
      },
      roleId,
    };
  }
}
