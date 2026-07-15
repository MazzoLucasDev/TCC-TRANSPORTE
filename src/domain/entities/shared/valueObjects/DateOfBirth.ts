import { left, right, type Either } from "../Either.js";
import { InvalidDateOfBirthError } from "../errors/InvalidDateOfBirthError.js";

const MAX_AGE = 100;
export class DateOfBirth {
  private constructor(private readonly date: Date) {
    Object.freeze(this);
  }

  static create(
    dateOfBirth: string,
  ): Either<InvalidDateOfBirthError, DateOfBirth> {
    const parsed = new Date(dateOfBirth);

    if (!DateOfBirth.validate(parsed)) {
      return left(new InvalidDateOfBirthError(dateOfBirth));
    }
    return right(new DateOfBirth(parsed));
  }

  static validate(date: Date): boolean {
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const today = new Date();
    if (date > today) {
      return false;
    }

    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - MAX_AGE);
    if (date < minDate) {
      return false;
    }

    return true;
  }

  getAge(): number {
    const today = new Date();
    let age = today.getFullYear() - this.date.getFullYear();

    const monthDiff = today.getMonth() - this.date.getMonth();
    const dayDiff = today.getDate() - this.date.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age;
  }

  get value(): Date {
    return this.date;
  }
}
