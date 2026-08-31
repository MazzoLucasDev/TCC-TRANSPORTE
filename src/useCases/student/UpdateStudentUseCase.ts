import { InvalidCollectionPointError } from "../../domain/entities/student/errors/InvalidCollectionPointError.js";
import type { Student } from "../../domain/entities/student/Student.js";
import { CollectionPoint } from "../../domain/entities/student/valueObjects/CollectionPoint.js";
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
  collectionPoint: { lat: number; long: number };
};

export type UpdateStudentOutputDto = {
  id: string;
  collectionPoint: { lat: number; long: number };
};

export type UpdateStudentError =
  | StudentNotFoundError
  | InvalidCollectionPointError
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

    const collectionPointOrError = CollectionPoint.create(
      input.collectionPoint,
    );
    if (collectionPointOrError.isLeft()) {
      return left(collectionPointOrError.value);
    }

    const updatedStudent = student.withUpdatedDetails({
      dateOfBirth: dateOfBirthOrError.value,
      collectionPoint: collectionPointOrError.value,
    });

    await this.studentRepository.update(updatedStudent);

    return right(this.presentOutput(updatedStudent));
  }
  private presentOutput(student: Student): UpdateStudentOutputDto {
    return { id: student.id, collectionPoint: student.collectionPoint.value };
  }
}
