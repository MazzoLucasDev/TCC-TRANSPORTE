import { Name } from "./valueObjects/Name.js";
import { Email } from "./valueObjects/Email.js";
import { Password } from "./valueObjects/Password.js";
import { Phone } from "./valueObjects/Phone.js";
import { UserType } from "./valueObjects/UserType.js";
import type { UserData } from "./UserData.js";
import { left, right, type Either } from "../../shared/Either.js";
import type { InvalidNameError } from "./errors/InvalidNameError.js";
import type { InvalidEmailError } from "./errors/InvalidEmailError.js";
import type { InvalidPasswordError } from "./errors/InvalidPasswordError.js";
import type { InvalidPhoneError } from "./errors/InvalidPhoneError.js";
import type { InvalidUserTypeError } from "./errors/InvalidUserTypeError.js";
import type { IPasswordHasher } from "../../services/IPasswordHasher.js";

export type UserProps = {
  readonly id: string;
  name: Name;
  email: Email;
  password: Password;
  phone: Phone;
  userType: UserType;
};

export type UserError =
  | InvalidNameError
  | InvalidEmailError
  | InvalidPasswordError
  | InvalidPhoneError
  | InvalidUserTypeError;

export class User {
  private constructor(private props: UserProps) {
    Object.freeze(this);
  }

  public static create(userData: UserData): Either<UserError, User> {
    const nameOrError = Name.create(userData.name);
    const emailOrError = Email.create(userData.email);
    const passOrError = Password.create(userData.password);
    const phoneOrError = Phone.create(userData.phone);
    const userTypeOrError = UserType.create(userData.userType);
    if (nameOrError.isLeft()) {
      return left(nameOrError.value);
    }
    if (emailOrError.isLeft()) {
      return left(emailOrError.value);
    }
    if (passOrError.isLeft()) {
      return left(passOrError.value);
    }
    if (phoneOrError.isLeft()) {
      return left(phoneOrError.value);
    }
    if (userTypeOrError.isLeft()) {
      return left(userTypeOrError.value);
    }
    const name = nameOrError.value;
    const email = emailOrError.value;
    const password = passOrError.value;
    const phone = phoneOrError.value;
    const userType = userTypeOrError.value;
    return right(
      new User({
        id: crypto.randomUUID().toString(),
        name,
        email,
        password,
        phone,
        userType,
      }),
    );
  }

  public static reconstitute(props: {
    id: string;
    name: string;
    email: string;
    hashedPassword: string;
    phone: string;
    userType: string;
  }): User {
    return new User({
      id: props.id,
      name: Name.restore(props.name),
      email: Email.restore(props.email),
      password: Password.restore(props.hashedPassword),
      phone: Phone.restore(props.phone),
      userType: UserType.restore(props.userType),
    });
  }
  get id(): string {
    return this.props.id;
  }

  get name(): Name {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get phone(): Phone {
    return this.props.phone;
  }

  get userType(): UserType {
    return this.props.userType;
  }
  toPersistence(): {
    id: string;
    name: string;
    email: string;
    password: string;
    phone: string;
    userType: string;
  } {
    return {
      id: this.props.id,
      name: this.props.name.value,
      email: this.props.email.value,
      password: this.props.password.value,
      phone: this.props.phone.value,
      userType: this.props.userType.value,
    };
  }
  async checkPassword(
    plainText: string,
    hasher: IPasswordHasher,
  ): Promise<boolean> {
    return hasher.compare(plainText, this.props.password.value);
  }
}
