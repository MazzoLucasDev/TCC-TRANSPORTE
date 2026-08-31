import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { NotStudentOwnerError } from "../shared/NotStudentOwnerError.js";
import type { UseCase } from "../useCase.js";
import { StudentNotFoundError } from "./errors/StudentNotFoundError.js";

export type DeleteStudentInputDto = {
  studentId: string;
  requesterId: string;
};

export type DeleteStudentOutputDto = { deleted: boolean };

export type DeleteStudentError = StudentNotFoundError | NotStudentOwnerError;

export class DeleteStudentUseCase implements UseCase<
  DeleteStudentInputDto,
  Either<DeleteStudentError, DeleteStudentOutputDto>
> {
  private constructor(private readonly studentRepository: IStudentRepository) {}

  public static create(studentRepository: IStudentRepository) {
    return new DeleteStudentUseCase(studentRepository);
  }

  public async execute(
    input: DeleteStudentInputDto,
  ): Promise<Either<DeleteStudentError, DeleteStudentOutputDto>> {
    const student = await this.studentRepository.findById(input.studentId);
    if (!student) {
      return left(new StudentNotFoundError(input.studentId));
    }
    if (student.userId !== input.requesterId) {
      return left(new NotStudentOwnerError(input.studentId));
    }

    await this.studentRepository.delete(input.studentId);

    return right({ deleted: true });
  }
}
