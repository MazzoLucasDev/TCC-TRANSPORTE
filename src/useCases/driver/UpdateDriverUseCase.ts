import type { Driver } from "../../domain/entities/driver/Driver.js";
import type { InvalidLicenseError } from "../../domain/entities/driver/errors/InvalidLicenseError.js";
import { UnderAgeError } from "../../domain/entities/driver/errors/UnderAgeDriverError.js";
import { License } from "../../domain/entities/driver/valueObjects/License.js";
import type { IDriverRepository } from "../../domain/repositories/IDriverRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import type { InvalidDateOfBirthError } from "../../domain/shared/errors/InvalidDateOfBirthError.js";
import { DateOfBirth } from "../../domain/shared/valueObjects/DateOfBirth.js";
import { NotDriverOwnerError } from "../shared/NotDriverOwnerError.js";
import type { UseCase } from "../useCase.js";
import { DriverNotFoundError } from "../van/errors/DriverNotFoundError.js";

const MIN_DRIVER_AGE = 18;

export type UpdateDriverInputDto = {
  driverId: string;
  requesterId: string;
  license: string;
  dateOfBirth: string;
};

export type UpdateDriverOutputDto = {
  id: string;
  license: string;
};

export type UpdateDriverError =
  | DriverNotFoundError
  | InvalidLicenseError
  | InvalidDateOfBirthError
  | NotDriverOwnerError
  | UnderAgeError;

export class UpdateDriverUseCase implements UseCase<
  UpdateDriverInputDto,
  Either<UpdateDriverError, UpdateDriverOutputDto>
> {
  private constructor(private readonly driverRepository: IDriverRepository) {}

  public static create(driverRepository: IDriverRepository) {
    return new UpdateDriverUseCase(driverRepository);
  }

  public async execute(
    input: UpdateDriverInputDto,
  ): Promise<Either<UpdateDriverError, UpdateDriverOutputDto>> {
    const driver = await this.driverRepository.findById(input.driverId);

    if (!driver) {
      return left(new DriverNotFoundError(input.driverId));
    }

    if (driver.userId !== input.requesterId) {
      return left(new NotDriverOwnerError(input.driverId));
    }

    const licenseOrError = License.create(input.license);
    if (licenseOrError.isLeft()) {
      return left(licenseOrError.value);
    }

    const dateOfBirth = DateOfBirth.create(input.dateOfBirth);
    if (dateOfBirth.isLeft()) {
      return left(dateOfBirth.value);
    }

    const age = dateOfBirth.value.getAge();
    if (age < MIN_DRIVER_AGE) {
      return left(new UnderAgeError(age));
    }

    const updatedDriver = driver.withUpdatedDetails({
      license: licenseOrError.value,
      dateOfBirth: dateOfBirth.value,
    });

    await this.driverRepository.update(updatedDriver);

    return right(this.presentOutput(updatedDriver));
  }

  private presentOutput(driver: Driver): UpdateDriverOutputDto {
    return { id: driver.id, license: driver.license.value };
  }
}
