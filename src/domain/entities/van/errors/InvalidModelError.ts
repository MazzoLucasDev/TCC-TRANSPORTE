import type { DomainError } from "../../shared/errors/DomainError.js";

export class InvalidModelError extends Error implements DomainError {
  constructor(model: string) {
    super(`O modelo "${model}" é inválido.`);
    this.name = "InvalidModelError";
  }
}
