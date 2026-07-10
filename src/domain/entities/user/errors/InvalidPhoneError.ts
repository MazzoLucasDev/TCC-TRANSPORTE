import type { DomainError } from "../../shared/DomainError.js";

export class InvalidPhoneError extends Error implements DomainError {
  constructor(phone: string) {
    super(`O número "${phone}" é inválido.`);
    this.name = "InvalidPhoneError";
  }
}
