import type { DomainError } from "../../../domain/shared/errors/DomainError.js";

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`Já existe um usuário cadastrado com o e-mail: ${email}`);
    this.name = "DuplicateEmailError";
  }
}
