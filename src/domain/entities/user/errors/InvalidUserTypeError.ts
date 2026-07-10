import type { DomainError } from "../../shared/DomainError.js";

export class InvalidUserTypeError extends Error implements DomainError {
  constructor(type: string) {
    super(`O tipo "${type}" é inválido.`);
    this.name = "InvalidUserTypeError";
  }
}
