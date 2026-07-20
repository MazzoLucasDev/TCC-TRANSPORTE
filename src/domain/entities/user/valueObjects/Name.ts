import { InvalidNameError } from "../errors/InvalidNameError.js";
import { right, left, type Either } from "../../../shared/Either.js";

export class Name {
  private constructor(private readonly name: string) {
    Object.freeze(this);
  }

  static create(name: string): Either<InvalidNameError, Name> {
    if (!Name.validate(name)) {
      return left(new InvalidNameError(name));
    }
    return right(new Name(name.trim()));
  }

  static validate(name: string): boolean {
    if (!name || name.trim().length < 2 || name.trim().length > 90) {
      return false;
    }
    return true;
  }

  get value(): string {
    return this.name;
  }
}
