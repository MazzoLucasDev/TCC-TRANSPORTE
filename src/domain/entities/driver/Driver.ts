import { left, right, type Either } from "../../shared/Either.js";
import type { InvalidDateOfBirthError } from "../../shared/errors/InvalidDateOfBirthError.js";
import { InvalidUserIdError } from "../../shared/errors/InvalidUserIdError.js";
import { DateOfBirth } from "../../shared/valueObjects/DateOfBirth.js";
import type { DriverData } from "./DriverData.js";
import type { InvalidLicenseError } from "./errors/InvalidLicenseError.js";
import { UnderAgeError } from "./errors/UnderAgeDriverError.js";
import { License } from "./valueObjects/License.js";

const MIN_DRIVER_AGE = 18;

export type DriverProps = {
  readonly id: string;
  readonly userId: string;
  license: License;
  dateOfBirth: DateOfBirth;
};

export type DriverError =
  | InvalidDateOfBirthError
  | InvalidUserIdError
  | InvalidLicenseError
  | UnderAgeError;

export class Driver {
  private constructor(private readonly props: DriverProps) {
    Object.freeze(this);
  }

  public static create(driverData: DriverData): Either<DriverError, Driver> {
    const licenseOrError = License.create(driverData.license);
    const dateOfBirthOrError = DateOfBirth.create(driverData.dateOfBirth);

    if (!driverData.userId || driverData.userId.trim().length === 0) {
      return left(new InvalidUserIdError(driverData.userId));
    }

    if (licenseOrError.isLeft()) {
      return left(licenseOrError.value);
    }

    if (dateOfBirthOrError.isLeft()) {
      return left(dateOfBirthOrError.value);
    }

    const age = dateOfBirthOrError.value.getAge();
    if (age < MIN_DRIVER_AGE) {
      return left(new UnderAgeError(age));
    }

    return right(
      new Driver({
        id: crypto.randomUUID(),
        userId: driverData.userId,
        license: licenseOrError.value,
        dateOfBirth: dateOfBirthOrError.value,
      }),
    );
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get license(): License {
    return this.props.license;
  }

  get dateOfBirth(): DateOfBirth {
    return this.props.dateOfBirth;
  }

  getAge(): number {
    return this.props.dateOfBirth.getAge();
  }
}
