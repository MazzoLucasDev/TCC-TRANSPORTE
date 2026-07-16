import type { DomainError } from "../../shared/errors/DomainError.js";

export class InvalidAttendanceDateError extends Error implements DomainError {
  constructor(date: string) {
    super(`Data de presença inválida: ${date}`);
    this.name = "InvalidAttendanceDateError";
  }
}
