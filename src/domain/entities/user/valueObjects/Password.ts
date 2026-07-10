import { left, right, type Either } from "../../shared/Either.js";
import { InvalidPasswordError } from "../errors/InvalidPasswordError.js";

export class Password {
  private constructor(private readonly pass: string) {
    Object.freeze(this);
  }

  static create(pass: string): Either<InvalidPasswordError, Password> {
    if (!Password.validate(pass)) {
      return left(new InvalidPasswordError(pass));
    }
    return right(new Password(pass));
  }

  static validate(pass: string): string | null {
    if (pass.length < 8) return "Deve ter no mínimo 8 caracteres!";

    if (!/\d/.test(pass)) return "Deve conter ao menos um número!";

    if (!/[a-z]/.test(pass)) return "Deve conter ao menos uma letra minúscula!";

    if (!/[A-Z]/.test(pass)) return "Deve conter ao menos uma letra maiúscula!";

    if (pass.length > 32) return "Deve conter até 32 caracteres!";

    return null;
  }

  get value(): string {
    return this.pass;
  }
}
