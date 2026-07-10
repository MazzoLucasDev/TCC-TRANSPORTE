import { right, left, type Either } from "../../shared/Either.js";
import { InvalidDestinyError } from "../errors/InvalidDestinyError.js";

export class Destiny {
  private constructor(private readonly destiny: string) {
    Object.freeze(this);
  }

  static create(destiny: string): Either<InvalidDestinyError, Destiny> {
    const normalized = destiny.trim();
    if (!Destiny.validate(normalized)) {
      return left(new InvalidDestinyError(normalized));
    }
    return right(new Destiny(normalized));
  }

  static validate(destiny: string): boolean {
    if (!destiny || destiny.length < 3 || destiny.length > 150) {
      return false;
    }
    return true;
  }
  get value(): string {
    return this.destiny;
  }
}
