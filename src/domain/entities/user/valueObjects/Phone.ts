import { left, right, type Either } from "../../shared/Either.js";
import { InvalidPhoneError } from "../errors/InvalidPhoneError.js";

export class Phone {
  private constructor(private readonly phone: string) {
    Object.freeze(this);
  }

  static create(phone: string): Either<InvalidPhoneError, Phone> {
    const onlyDigits = phone.replace(/\D/g, "");
    if (!Phone.validate(onlyDigits)) {
      return left(new InvalidPhoneError(phone));
    }
    return right(new Phone(onlyDigits));
  }

  static validate(phone: string): boolean {
    if (phone.length !== 10 && phone.length !== 11) return false;

    const ddd = Number(phone.slice(0, 2));

    if (ddd < 11 || ddd > 99) {
      return false;
    }
    return true;
  }

  get value(): string {
    return this.phone;
  }
}
