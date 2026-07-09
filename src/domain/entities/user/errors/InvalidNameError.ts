import type { DomainError } from "./DomainError.js";

export class InvalidNameError extends Error implements DomainError {
  constructor(name: string) {
    super(`O nome "${name}" é inválido.`);
    this.name = "InvalidNameError";
  }
}
