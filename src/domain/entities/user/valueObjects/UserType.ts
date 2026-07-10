import { left, right, type Either } from "../../shared/Either.js";
import { InvalidUserTypeError } from "../errors/InvalidUserTypeError.js";

const TIPOS_VALIDOS = ["MOTORISTA", "ALUNO"] as const;
export type TipoUsuario = (typeof TIPOS_VALIDOS)[number];

export class UserType {
  private constructor(private readonly type: TipoUsuario) {
    Object.freeze(this);
  }

  static create(type: string): Either<InvalidUserTypeError, UserType> {
    const normalized = type.trim().toUpperCase();
    if (!UserType.validate(normalized)) {
      return left(new InvalidUserTypeError(type));
    }
    return right(new UserType(normalized as TipoUsuario));
  }

  static validate(type: string): type is TipoUsuario {
    return TIPOS_VALIDOS.includes(type as TipoUsuario);
  }

  isMotorista(): boolean {
    return this.type === "MOTORISTA";
  }

  isAluno(): boolean {
    return this.type === "ALUNO";
  }

  get value(): TipoUsuario {
    return this.type;
  }
}
