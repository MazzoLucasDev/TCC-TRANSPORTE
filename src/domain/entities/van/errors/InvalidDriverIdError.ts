import type { DomainError } from "../../../shared/errors/DomainError.js";

export class InvalidDriverIdError extends Error implements DomainError {
  constructor(driverID: string) {
    super(`O ID "${driverID}" é inválido.`);
    this.name = "InvalidDriverIdError";
  }
}
