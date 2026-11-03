import type { DomainError } from "./DomainError.js";

export class InvalidCoordinatesError extends Error implements DomainError {
  constructor(lat: number, long: number) {
    super(`Coordenadas inválidas: latitude=${lat}, longitude=${long}`);
    this.name = "InvalidCoordinatesError";
  }
}
