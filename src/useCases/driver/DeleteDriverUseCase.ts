import type { IDriverRepository } from "../../domain/repositories/IDriverRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { NotDriverOwnerError } from "../shared/NotDriverOwnerError.js";
import type { UseCase } from "../useCase.js";
import { DriverNotFoundError } from "../van/errors/DriverNotFoundError.js";

export type DeleteDriverInputDto = {
  driverId: string;
  requesterId: string;
};

export type DeleteDriverOutputDto = { deleted: boolean };

export type DeleteDriverError = DriverNotFoundError | NotDriverOwnerError;

export class DeleteDriverUseCase implements UseCase<
  DeleteDriverInputDto,
  Either<DeleteDriverError, DeleteDriverOutputDto>
> {
  private constructor(private readonly driverRepository: IDriverRepository) {}

  public static create(driverRepository: IDriverRepository) {
    return new DeleteDriverUseCase(driverRepository);
  }

  public async execute(
    input: DeleteDriverInputDto,
  ): Promise<Either<DeleteDriverError, DeleteDriverOutputDto>> {
    const driver = await this.driverRepository.findById(input.driverId);
    if (!driver) {
      return left(new DriverNotFoundError(input.driverId));
    }
    if (driver.userId !== input.requesterId) {
      return left(new NotDriverOwnerError(input.driverId));
    }

    await this.driverRepository.delete(input.driverId);

    return right({ deleted: true });
  }
}
