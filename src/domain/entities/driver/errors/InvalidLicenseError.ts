import type { DomainError } from "../../shared/errors/DomainError.js";

export class InvalidLicenseError extends Error implements DomainError {
  constructor(license: string) {
    super(`A CNH "${license}" é inválida`);
    this.name = "InvalidLicenseError";
  }
}
