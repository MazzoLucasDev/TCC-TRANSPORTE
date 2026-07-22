import { stringify } from "node:querystring";
import { Van, type VanError } from "../../domain/entities/van/Van.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import type { UseCase } from "../useCase.js";
import { DriverNotFoundError } from "./errors/DriverNotFoundError.js";
import { UserIsNotDriverError } from "./errors/UserIsNotDriverError.js";

export type CreateVanInputDto = {
  model: string;
  year: number;
  period: string;
  destiny: string;
  capacity: number;
  driverId: string;
};

export type CreateVanOutputDto = {
  id: string;
  model: string;
  capacity: number;
};

export type createVanError =
  | VanError
  | DriverNotFoundError
  | UserIsNotDriverError;

export class CreateVanUseCase implements UseCase<
  CreateVanInputDto,
  Either<createVanError, CreateVanOutputDto>
> {
  private constructor(
    private readonly vanRepository: IVanRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  public static create(
    vanRepository: IVanRepository,
    userRepository: IUserRepository,
  ) {
    return new CreateVanUseCase(vanRepository, userRepository);
  }

  public async execute(
    input: CreateVanInputDto,
  ): Promise<Either<createVanError, CreateVanOutputDto>> {
    const driverOrError = await this.userRepository.findById(input.driverId);
    if (!driverOrError) {
      return left(new DriverNotFoundError(input.driverId));
    }
    if (!driverOrError.userType.isMotorista()) {
      return left(new UserIsNotDriverError(input.driverId));
    }
    const vanOrError = Van.create({
      model: input.model,
      year: input.year,
      period: input.period,
      destiny: input.destiny,
      capacity: input.capacity,
      driverId: input.driverId,
    });
    if (vanOrError.isLeft()) {
      return left(vanOrError.value);
    }

    const van = vanOrError.value;
    await this.vanRepository.create(van);

    return right(this.presentOutput(van));
  }
  private presentOutput(van: Van): CreateVanOutputDto {
    return {
      id: van.id,
      model: van.model.value,
      capacity: van.capacity.value,
    };
  }
}
