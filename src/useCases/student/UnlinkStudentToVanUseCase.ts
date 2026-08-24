import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import type { UseCase } from "../useCase.js";
import { StudentNotFoundError } from "./errors/StudentNotFoundError.js";
import { StudentNotLinkedError } from "./errors/StudentNotLinkedError.js";

export type UnlinkStudentToVanInputDto = {
  studentId: string;
};

export type UnlinkStudentToVanOutputDto = {
  studentId: string;
  vanId: null;
};

export type UnlinkStudentToVanErrors =
  | StudentNotLinkedError
  | StudentNotFoundError;

export class UnlinkStudentToVanUseCase implements UseCase<
  UnlinkStudentToVanInputDto,
  Either<UnlinkStudentToVanErrors, UnlinkStudentToVanOutputDto>
> {
  private constructor(private readonly studentRepository: IStudentRepository) {}

  public static create(studentRepository: IStudentRepository) {
    return new UnlinkStudentToVanUseCase(studentRepository);
  }

  public async execute(
    input: UnlinkStudentToVanInputDto,
  ): Promise<Either<UnlinkStudentToVanErrors, UnlinkStudentToVanOutputDto>> {
    const student = await this.studentRepository.findById(input.studentId);
    if (!student) {
      return left(new StudentNotFoundError(input.studentId));
    }
    if (!student.isLinkedToVan()) {
      return left(new StudentNotLinkedError(input.studentId));
    }

    const updatedStudent = student.unlinkFromVan();
    await this.studentRepository.update(updatedStudent);

    return right(this.presentOutput(updatedStudent));
  }

  private presentOutput(student: {
    id: string;
    vanId: string | null;
  }): UnlinkStudentToVanOutputDto {
    return {
      studentId: student.id,
      vanId: null,
    };
  }
}
