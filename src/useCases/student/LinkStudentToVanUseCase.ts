import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import type { UseCase } from "../useCase.js";
import { StudentAlreadyLinkedError } from "./errors/StudentAlreadyLinkedError.js";
import { StudentNotFoundError } from "./errors/StudentNotFoundError.js";
import { VanFullError } from "./errors/VanFullError.js";
import { VanNotFoundError } from "./errors/VanNotFoundError.js";

export type LinkStudentToVanInputDto = {
  studentId: string;
  vanId: string;
};

export type LinkStudentToVanOutputDto = {
  studentId: string;
  vanId: string;
};

export type LinkStudentToVanError =
  | StudentAlreadyLinkedError
  | StudentNotFoundError
  | VanNotFoundError
  | VanFullError;

export class LinkStudentToVanUseCase implements UseCase<
  LinkStudentToVanInputDto,
  Either<LinkStudentToVanError, LinkStudentToVanOutputDto>
> {
  private constructor(
    private readonly vanRepository: IVanRepository,
    private readonly studentRepository: IStudentRepository,
  ) {}

  public static create(
    vanRepository: IVanRepository,
    studentRepository: IStudentRepository,
  ) {
    return new LinkStudentToVanUseCase(vanRepository, studentRepository);
  }

  public async execute(
    input: LinkStudentToVanInputDto,
  ): Promise<Either<LinkStudentToVanError, LinkStudentToVanOutputDto>> {
    const van = await this.vanRepository.findById(input.vanId);
    if (!van) {
      return left(new VanNotFoundError(input.vanId));
    }

    const student = await this.studentRepository.findById(input.studentId);
    if (!student) {
      return left(new StudentNotFoundError(input.studentId));
    }
    if (student.isLinkedToVan()) {
      return left(new StudentAlreadyLinkedError(input.studentId));
    }

    //Caso eu queira otimizar, é bom criar um countByVanId no repository, melhor eficiencia
    const studentsInVan = await this.studentRepository.listByVanId(input.vanId);
    if (!van.verificarCapacidade(studentsInVan.length)) {
      return left(new VanFullError(input.vanId));
    }

    const updatedStudent = student.linkToVan(van.id);
    await this.studentRepository.update(updatedStudent);

    return right(this.presentOutput(updatedStudent));
  }
  private presentOutput(student: {
    id: string;
    vanId: string | null;
  }): LinkStudentToVanOutputDto {
    return {
      studentId: student.id,
      vanId: student.vanId as string,
    };
  }
}
