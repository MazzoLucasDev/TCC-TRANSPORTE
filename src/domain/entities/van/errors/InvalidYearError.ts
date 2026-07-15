import type { DomainError } from "../../shared/errors/DomainError.js";

export class InvalidYearError extends Error implements DomainError {
  constructor(year: number) {
    super(`O ano de "${year}" é inválido.`);
    this.name = "InvalidYearError";
  }
}
