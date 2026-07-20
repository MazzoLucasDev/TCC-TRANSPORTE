import { left, right, type Either } from "../../shared/Either.js";
import { InvalidCollectionPointError } from "./errors/InvalidCollectionPointError.js";
import { InvalidUserIdError } from "../../shared/errors/InvalidUserIdError.js";
import type { StudentData } from "./StudentData.js";
import { CollectionPoint } from "./valueObjects/CollectionPoint.js";
import { DateOfBirth } from "../../shared/valueObjects/DateOfBirth.js";
import type { InvalidDateOfBirthError } from "../../shared/errors/InvalidDateOfBirthError.js";

export type StudentProps = {
  readonly id: string;
  readonly userId: string;
  vanId: string | null;
  dateOfBirth: DateOfBirth;
  collectionPoint: CollectionPoint;
};

export type StudentError =
  | InvalidUserIdError
  | InvalidDateOfBirthError
  | InvalidCollectionPointError;

export class Student {
  private constructor(private readonly props: StudentProps) {
    Object.freeze(this);
  }

  public static create(
    studentData: StudentData,
  ): Either<StudentError, Student> {
    if (!studentData.userId || studentData.userId.trim().length === 0) {
      return left(new InvalidUserIdError(studentData.userId));
    }

    const dateOfBirthOrError = DateOfBirth.create(studentData.dateOfBirth);
    if (dateOfBirthOrError.isLeft()) {
      return left(dateOfBirthOrError.value);
    }

    const collectionPointOrError = CollectionPoint.create(
      studentData.collectionPoint,
    );
    if (collectionPointOrError.isLeft()) {
      return left(collectionPointOrError.value);
    }

    return right(
      new Student({
        id: crypto.randomUUID(),
        userId: studentData.userId,
        dateOfBirth: dateOfBirthOrError.value,
        collectionPoint: collectionPointOrError.value,
        vanId: null,
      }),
    );
  }
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get collectionPoint(): CollectionPoint {
    return this.props.collectionPoint;
  }

  get vanId(): string | null {
    return this.props.vanId;
  }

  isLinkedToVan(): boolean {
    return this.props.vanId !== null;
  }

  linkToVan(vanId: string): Student {
    return new Student({ ...this.props, vanId });
  }

  unlinkFromVan(): Student {
    return new Student({ ...this.props, vanId: null });
  }
  get dateOfBirth(): DateOfBirth {
    return this.props.dateOfBirth;
  }

  getAge(): number {
    return this.props.dateOfBirth.getAge();
  }
}
