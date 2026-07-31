import { left, right, type Either } from "../../../shared/Either.js";
import { InvalidLicenseError } from "../errors/InvalidLicenseError.js";

export class License {
  private constructor(private readonly license: string) {
    Object.freeze(this);
  }
  static create(license: string): Either<InvalidLicenseError, License> {
    const normalized = license.replace(/\D/g, "");
    if (!License.validate(normalized)) {
      return left(new InvalidLicenseError(normalized));
    }
    return right(new License(normalized));
  }
  static validate(license: string): boolean {
    return /^\d{11}$/.test(license);
  }
  get value(): string {
    return this.license;
  }
  static restore(value: string): License {
    return new License(value);
  }
}
