import type { DomainError } from "../../shared/DomainError.js";

export class InvalidCapacityError extends Error implements DomainError {
  constructor(capacity: number) {
    super(`A capacidade "${capacity}" é inválida.`);
    this.name = "InvalidEmailError";
  }
}
