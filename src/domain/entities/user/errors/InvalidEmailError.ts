import type { DomainError } from "../../../shared/errors/DomainError.js";

export class InvalidEmailError extends Error implements DomainError {
  constructor(email: string) {
    super(`O email "${email}" é inválido.`);
    this.name = "InvalidEmailError";
  }
}
