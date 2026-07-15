import type { DomainError } from "../../shared/errors/DomainError.js";

export class InvalidUserTypeError extends Error implements DomainError {
  constructor(type: string) {
    super(`O tipo "${type}" é inválido.`);
    this.name = "InvalidUserTypeError";
  }
}
