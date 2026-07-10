import type { DomainError } from "../../shared/DomainError.js";

export class InvalidPasswordError extends Error implements DomainError {
  constructor(pass: string) {
    super(`A senha é inválida.`);
    this.name = "InvalidPasswordError";
  }
}
