import type { DomainError } from "../../shared/errors/DomainError.js";

export class InvalidDestinyError extends Error implements DomainError {
  constructor(destiny: string) {
    super(`O destino "${destiny}" é inválido.`);
    this.name = "InvalidDestinyError";
  }
}
