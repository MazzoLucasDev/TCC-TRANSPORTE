import type { Student } from "../../domain/entities/student/Student.js";
import type { User } from "../../domain/entities/user/User.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import type { UseCase } from "../useCase.js";
import { UserNotFoundError } from "../user/errors/UserNotFoundError.js";
import { StudentNotFoundError } from "./errors/StudentNotFoundError.js";

export type GetStudentSummaryInputDto = { studentId: string };

export type GetStudentSummaryOutputDto = {
  studentId: string;
  name: string;
  phone: string;
  isLinkedToVan: boolean;
};

export type GetStudentSummaryError = StudentNotFoundError | UserNotFoundError;

export class GetStudentSummaryUseCase implements UseCase<
  GetStudentSummaryInputDto,
  Either<GetStudentSummaryError, GetStudentSummaryOutputDto>
> {
  private constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  public static create(
    studentRepository: IStudentRepository,
    userRepository: IUserRepository,
  ) {
    return new GetStudentSummaryUseCase(studentRepository, userRepository);
  }

  public async execute(
    input: GetStudentSummaryInputDto,
  ): Promise<Either<GetStudentSummaryError, GetStudentSummaryOutputDto>> {
    const student = await this.studentRepository.findById(input.studentId);
    if (!student) {
      return left(new StudentNotFoundError(input.studentId));
    }

    const user = await this.userRepository.findById(student.userId);
    if (!user) {
      return left(new UserNotFoundError(student.userId));
    }

    return right(this.presentOutput(student, user));
  }
  private presentOutput(
    student: Student,
    user: User,
  ): GetStudentSummaryOutputDto {
    return {
      studentId: student.id,
      name: user.name.value,
      phone: user.phone.value,
      isLinkedToVan: student.isLinkedToVan(),
    };
  }
}
