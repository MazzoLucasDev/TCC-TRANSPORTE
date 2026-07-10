import { right, left, type Either } from "../../shared/Either.js";
import { InvalidYearError } from "../errors/InvalidYearError.js";

const ANO_MINIMO = 1990;
export class Year {
  private constructor(private readonly year: number) {
    Object.freeze(this);
  }

  static create(year: number): Either<InvalidYearError, Year> {
    if (!Year.validate(year)) {
      return left(new InvalidYearError(year));
    }
    return right(new Year(year));
  }

  static validate(year: number): boolean {
    const anoAtual = new Date().getFullYear();
    if (!Number.isInteger(year)) {
      return false;
    }
    if (year < ANO_MINIMO || year > anoAtual + 1) {
      return false;
    }
    return true;
  }
  get value(): number {
    return this.year;
  }
}
