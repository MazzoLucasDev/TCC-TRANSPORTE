import type { DomainError } from "../../shared/errors/DomainError.js";

export class InvalidCollectionPointError extends Error implements DomainError {
  constructor(latitude: number, longitude: number) {
    super(
      `Ponto de coleta inválido: latitude=${latitude}, longitude=${longitude}`,
    );
    this.name = "InvalidCollectionPointError";
  }
}
