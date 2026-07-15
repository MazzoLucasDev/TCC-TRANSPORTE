import type { DomainError } from "../../shared/errors/DomainError.js";

export class UnderAgeError extends Error implements DomainError {
  constructor(age: number) {
    super(`O motorista não pode ser de menor. Idade informada: ${age}`);
    this.name = "UnderAgeError";
  }
}
