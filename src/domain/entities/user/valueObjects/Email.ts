import { left, right, type Either } from "../../../shared/Either.js";
import { InvalidEmailError } from "../errors/InvalidEmailError.js";

export class Email {
  private constructor(private readonly email: string) {
    Object.freeze(this);
  }

  static create(email: string): Either<InvalidEmailError, Email> {
    const normalized = email.trim().toLowerCase();
    if (!Email.validate(normalized)) {
      return left(new InvalidEmailError(email));
    }
    return right(new Email(normalized));
  }

  static validate(email: string): boolean {
    const tester =
      /^[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
    if (!email) {
      return false;
    }
    if (email.length > 256) {
      return false;
    }
    if (!tester.test(email)) {
      return false;
    }
    const parts = email.split("@");

    if (parts.length !== 2) return false;

    const [account, address] = parts;

    if (!account || !address) {
      return false;
    }

    if (account.length > 64) {
      return false;
    }
    const domainParts = address.split(".");
    if (
      domainParts.some(function (part) {
        return part.length > 63;
      })
    ) {
      return false;
    }
    return true;
  }

  get value(): string {
    return this.email;
  }
}
