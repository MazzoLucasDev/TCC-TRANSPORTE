import type { DomainError } from "../../../shared/errors/DomainError.js";

export class InvalidPeriodError extends Error implements DomainError {
  constructor(period: string) {
    super(`O periodo "${period}" é inválido.`);
    this.name = "InvalidPeriodError";
  }
}
