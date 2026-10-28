import type { Student } from "../../domain/entities/student/Student.js";
import type { User } from "../../domain/entities/user/User.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { VanNotFoundError } from "../shared/VanNotFoundError.js";
import type { UseCase } from "../useCase.js";
import { NotVanMemberError } from "../shared/NotVanMemberError.js";

export type ListVanStudentInputDto = { requesterId: string; vanId: string };

export type ListVanStudentOutputDto = {
  students: Array<{
    id: string;
    userId: string;
    name: string;
    phone: string;
    collectionPoint: { lat: number; long: number };
  }>;
};

export type ListVanStudentError = NotVanMemberError | VanNotFoundError;

export class ListVanStudentUseCase implements UseCase<
  ListVanStudentInputDto,
  Either<ListVanStudentError, ListVanStudentOutputDto>
> {
  private constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly userRepository: IUserRepository,
    private readonly vanRepository: IVanRepository,
  ) {}

  public static create(
    studentRepository: IStudentRepository,
    userRepository: IUserRepository,
    vanRepository: IVanRepository,
  ) {
    return new ListVanStudentUseCase(
      studentRepository,
      userRepository,
      vanRepository,
    );
  }

  public async execute(
    input: ListVanStudentInputDto,
  ): Promise<Either<ListVanStudentError, ListVanStudentOutputDto>> {
    const van = await this.vanRepository.findById(input.vanId);
    if (!van) return left(new VanNotFoundError(input.vanId));

    if (van.driverId !== input.requesterId) {
      const me = await this.studentRepository.findByUserId(input.requesterId);
      if (!me || me.vanId !== input.vanId) {
        return left(new NotVanMemberError(input.vanId));
      }
    }

    const students = await this.studentRepository.listByVanId(input.vanId);
    const entries = await Promise.all(
      students.map(async (student) => ({
        student,
        user: await this.userRepository.findById(student.userId),
      })),
    );

    return right(this.presentOutput(entries));
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
