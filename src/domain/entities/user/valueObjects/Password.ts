import { left, right, type Either } from "../../../shared/Either.js";
import { InvalidPasswordError } from "../errors/InvalidPasswordError.js";

export class Password {
  private constructor(private readonly password: string) {
    Object.freeze(this);
  }

  static create(password: string): Either<InvalidPasswordError, Password> {
    const erro = Password.validate(password);
    if (erro) {
      return left(new InvalidPasswordError(erro)); // passa a mensagem, não a senha crua
    }
    return right(new Password(password));
  }

  static validate(password: string): string | null {
    if (password.length < 8) return "Deve ter no mínimo 8 caracteres!";

    if (!/\d/.test(password)) return "Deve conter ao menos um número!";

    if (!/[a-z]/.test(password))
      return "Deve conter ao menos uma letra minúscula!";

    if (!/[A-Z]/.test(password))
      return "Deve conter ao menos uma letra maiúscula!";

    if (password.length > 32) return "Deve conter até 32 caracteres!";

    return null;
  }

  static restore(value: string): Password {
    return new Password(value); // sem validar, confia que já foi validado antes
  }

  get value(): string {
    return this.password;
  }
}
