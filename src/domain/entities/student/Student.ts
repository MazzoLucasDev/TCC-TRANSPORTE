import { left, right, type Either } from "../../shared/Either.js";
import { InvalidCoordinatesError } from "../../shared/errors/InvalidCoordinatesError.js";
import { InvalidUserIdError } from "../../shared/errors/InvalidUserIdError.js";
import type { StudentData } from "./StudentData.js";
import { Coordinates } from "../../shared/valueObjects/Coordinates.js";
import { DateOfBirth } from "../../shared/valueObjects/DateOfBirth.js";
import type { InvalidDateOfBirthError } from "../../shared/errors/InvalidDateOfBirthError.js";

export type StudentProps = {
  readonly id: string;
  readonly userId: string;
  vanId: string | null;
  dateOfBirth: DateOfBirth;
  coordinates: Coordinates;
};

export type StudentError =
  | InvalidUserIdError
  | InvalidDateOfBirthError
  | InvalidCoordinatesError;

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

    const coordinatesOrError = Coordinates.create(studentData.coordinates);
    if (coordinatesOrError.isLeft()) {
      return left(coordinatesOrError.value);
    }

    return right(
      new Student({
        id: crypto.randomUUID(),
        userId: studentData.userId,
        dateOfBirth: dateOfBirthOrError.value,
        coordinates: coordinatesOrError.value,
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

  get coordinates(): Coordinates {
    return this.props.coordinates;
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
  withUpdatedDetails(props: {
    dateOfBirth: DateOfBirth;
    coordinates: Coordinates;
  }): Student {
    return new Student({ ...this.props, ...props });
  }
  toPersistence(): {
    id: string;
    userId: string;
    dateOfBirth: Date;
    lat: number;
    long: number;
    vanId: string | null;
  } {
    return {
      id: this.props.id,
      userId: this.props.userId,
      dateOfBirth: this.props.dateOfBirth.value,
      lat: this.props.coordinates.value.lat,
      long: this.props.coordinates.value.long,
      vanId: this.props.vanId,
    };
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    dateOfBirth: Date;
    lat: number;
    long: number;
    vanId: string | null;
  }): Student {
    return new Student({
      id: props.id,
      userId: props.userId,
      dateOfBirth: DateOfBirth.restore(props.dateOfBirth),
      coordinates: Coordinates.restore({
        lat: props.lat,
        long: props.long,
      }),
      vanId: props.vanId,
    });
  }
}
