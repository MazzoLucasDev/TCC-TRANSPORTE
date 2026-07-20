import type { DomainError } from "../../../shared/errors/DomainError.js";

export class InvalidRouteError extends Error implements DomainError {
  constructor(reason: string) {
    super(`Rota inválida: ${reason}`);
    this.name = "InvalidRouteError";
  }
}
