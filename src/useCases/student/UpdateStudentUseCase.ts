import { InvalidCoordinatesError } from "../../domain/shared/errors/InvalidCoordinatesError.js";
import type { Student } from "../../domain/entities/student/Student.js";
import { Coordinates } from "../../domain/shared/valueObjects/Coordinates.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { InvalidDateOfBirthError } from "../../domain/shared/errors/InvalidDateOfBirthError.js";
import { DateOfBirth } from "../../domain/shared/valueObjects/DateOfBirth.js";
import { NotStudentOwnerError } from "../shared/NotStudentOwnerError.js";
import type { UseCase } from "../useCase.js";
import { StudentNotFoundError } from "./errors/StudentNotFoundError.js";

export type UpdateStudentInputDto = {
  studentId: string;
  requesterId: string;
  dateOfBirth: string;
  coordinates: { lat: number; long: number };
};

export type UpdateStudentOutputDto = {
  id: string;
  coordinates: { lat: number; long: number };
};

export type UpdateStudentError =
  | StudentNotFoundError
  | InvalidCoordinatesError
  | InvalidDateOfBirthError
  | NotStudentOwnerError;

export class UpdateStudentUseCase implements UseCase<
  UpdateStudentInputDto,
  Either<UpdateStudentError, UpdateStudentOutputDto>
> {
  private constructor(private readonly studentRepository: IStudentRepository) {}

  public static create(studentRepository: IStudentRepository) {
    return new UpdateStudentUseCase(studentRepository);
  }

  public async execute(
    input: UpdateStudentInputDto,
  ): Promise<Either<UpdateStudentError, UpdateStudentOutputDto>> {
    const student = await this.studentRepository.findById(input.studentId);
    if (!student) {
      return left(new StudentNotFoundError(input.studentId));
    }
    if (student.userId !== input.requesterId) {
      return left(new NotStudentOwnerError(input.studentId));
    }

    const dateOfBirthOrError = DateOfBirth.create(input.dateOfBirth);
    if (dateOfBirthOrError.isLeft()) {
      return left(dateOfBirthOrError.value);
    }

    const coordinatesOrError = Coordinates.create(input.coordinates);
    if (coordinatesOrError.isLeft()) {
      return left(coordinatesOrError.value);
    }

    const updatedStudent = student.withUpdatedDetails({
      dateOfBirth: dateOfBirthOrError.value,
      coordinates: coordinatesOrError.value,
    });

    await this.studentRepository.update(updatedStudent);

    return right(this.presentOutput(updatedStudent));
  }
  private presentOutput(student: Student): UpdateStudentOutputDto {
    return { id: student.id, coordinates: student.coordinates.value };
  }
}
