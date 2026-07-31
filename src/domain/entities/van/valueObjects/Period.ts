import { left, right, type Either } from "../../../shared/Either.js";
import { InvalidPeriodError } from "../errors/InvalidPeriodError.js";

const VALID_PERIOD = ["MANHA", "TARDE", "NOITE"] as const;
export type PeriodType = (typeof VALID_PERIOD)[number];

export class Period {
  private constructor(private readonly period: PeriodType) {
    Object.freeze(this);
  }

  static create(period: string): Either<InvalidPeriodError, Period> {
    const normalized = period.trim().toUpperCase();
    if (!Period.validate(normalized)) {
      return left(new InvalidPeriodError(period));
    }
    return right(new Period(normalized));
  }

  static validate(period: string): period is PeriodType {
    return VALID_PERIOD.includes(period as PeriodType);
  }

  static restore(value: string): Period {
    return new Period(value as PeriodType);
  }

  get value(): PeriodType {
    return this.period;
  }
}
