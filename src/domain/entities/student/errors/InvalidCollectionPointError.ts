import type { DomainError } from "../../../shared/errors/DomainError.js";

export class InvalidCollectionPointError extends Error implements DomainError {
  constructor(lat: number, long: number) {
    super(`Ponto de coleta inválido: latitude=${lat}, longitude=${long}`);
    this.name = "InvalidCollectionPointError";
  }
}
