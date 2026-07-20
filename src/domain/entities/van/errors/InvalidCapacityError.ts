import type { DomainError } from "../../../shared/errors/DomainError.js";

export class InvalidCapacityError extends Error implements DomainError {
  constructor(capacity: number) {
    super(`A capacidade "${capacity}" é inválida.`);
    this.name = "InvalidCapacityError";
  }
}
