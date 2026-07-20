import type { DomainError } from "./DomainError.js";

export class InvalidDateOfBirthError extends Error implements DomainError {
  constructor(dateOfBirth: string) {
    super(`Data de nascimento inválida: ${dateOfBirth}`);
    this.name = "InvalidDateOfBirthError";
  }
}
