import { right, left, type Either } from "../../shared/Either.js";
import { InvalidCapacityError } from "../errors/InvalidCapacityError.js";

export class Capacity {
  private constructor(private readonly capacity: number) {
    Object.freeze(this);
  }

  static create(capacity: number): Either<InvalidCapacityError, Capacity> {
    if (!Capacity.validate(capacity)) {
      return left(new InvalidCapacityError(capacity));
    }
    return right(new Capacity(capacity));
  }

  static validate(capacity: number): boolean | string {
    if (!Number.isInteger(capacity)) {
      return false;
    }
    if (capacity < 1 || capacity > 50) {
      return "Capacidade deve ser entre 1 a 50.";
    }
    return true;
  }
  get value(): number {
    return this.capacity;
  }
}
