import type { Student } from "../../domain/entities/student/Student.js";
import type { User } from "../../domain/entities/user/User.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { UseCase } from "../useCase.js";

export type ListVanStudentInputDto = { vanId: string };

export type ListVanStudentOutputDto = {
  students: Array<{
    id: string;
    userId: string;
    name: string;
    phone: string;
    collectionPoint: { lat: number; long: number };
  }>;
};

export class ListVanStudentUseCase implements UseCase<
  ListVanStudentInputDto,
  ListVanStudentOutputDto
> {
  private constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  public static create(
    studentRepository: IStudentRepository,
    userRepository: IUserRepository,
  ) {
    return new ListVanStudentUseCase(studentRepository, userRepository);
  }

  public async execute(
    input: ListVanStudentInputDto,
  ): Promise<ListVanStudentOutputDto> {
    const students = await this.studentRepository.listByVanId(input.vanId);

    const entries = await Promise.all(
      students.map(async (student) => ({
        student,
        user: await this.userRepository.findById(student.userId),
      })),
    );

    return this.presentOutput(entries);
  }

  private presentOutput(
    entries: Array<{ student: Student; user: User | null }>,
  ): ListVanStudentOutputDto {
    return {
      students: entries.map(({ student, user }) => ({
        id: student.id,
        userId: student.userId,
        name: user?.name.value ?? "Aluno sem cadastro",
        phone: user?.phone.value ?? "",
        collectionPoint: student.collectionPoint.value,
      })),
    };
  }
}
