import type { Student } from "../../domain/entities/student/Student.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { UseCase } from "../useCase.js";

export type ListVanStudentInputDto = {
  vanId: string;
};

export type ListDriverVansOutputDto = {
  students: Array<{
    id: string;
    userId: string;
    collectionPoint: { lat: number; long: number };
  }>;
};

export class ListVanStudentUseCase implements UseCase<
  ListVanStudentInputDto,
  ListDriverVansOutputDto
> {
  private constructor(private readonly studentRepository: IStudentRepository) {}

  public static create(studentRepository: IStudentRepository) {
    return new ListVanStudentUseCase(studentRepository);
  }

  public async execute(
    input: ListVanStudentInputDto,
  ): Promise<ListDriverVansOutputDto> {
    const students = await this.studentRepository.listByVanId(input.vanId);
    return this.presentOutput(students);
  }

  private presentOutput(students: Student[]): ListDriverVansOutputDto {
    return {
      students: students.map((student) => ({
        id: student.id,
        userId: student.userId,
        collectionPoint: student.collectionPoint.value,
      })),
    };
  }
}
