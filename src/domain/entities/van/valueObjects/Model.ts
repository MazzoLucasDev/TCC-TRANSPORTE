import { right, left, type Either } from "../../../shared/Either.js";
import { InvalidModelError } from "../errors/InvalidModelError.js";

export class Model {
  private constructor(private readonly model: string) {
    Object.freeze(this);
  }

  static create(model: string): Either<InvalidModelError, Model> {
    const normalized = model.trim();
    if (!Model.validate(normalized)) {
      return left(new InvalidModelError(normalized));
    }
    return right(new Model(normalized));
  }

  static validate(model: string): boolean {
    if (!model || model.length < 2 || model.length > 100) {
      return false;
    }
    return true;
  }

  static restore(value: string): Model {
    return new Model(value);
  }

  get value(): string {
    return this.model;
  }
}
