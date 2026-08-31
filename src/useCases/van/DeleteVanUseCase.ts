import { Van } from "../../domain/entities/van/Van.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import type { UseCase } from "../useCase.js";
import { NotVanOwnerError } from "../shared/NotVanOwnerError.js";

export type DeleteVanInputDto = {
  id: string;
  requesterId: string;
};

export type DeleteVanOutputDto = {
  deleted: boolean;
};

export type DeleteVanErrors = VanNotFoundError | NotVanOwnerError;

export class DeleteVanUseCase implements UseCase<
  DeleteVanInputDto,
  Either<DeleteVanErrors, DeleteVanOutputDto>
> {
  private constructor(
    private readonly vanRepository: IVanRepository,
    private readonly studentRepository: IStudentRepository,
  ) {}

  public static create(
    vanRepository: IVanRepository,
    studentRepository: IStudentRepository,
  ) {
    return new DeleteVanUseCase(vanRepository, studentRepository);
  }

  public async execute(
    input: DeleteVanInputDto,
  ): Promise<Either<VanNotFoundError, DeleteVanOutputDto>> {
    const van = await this.vanRepository.findById(input.id);
    if (!van) return left(new VanNotFoundError(input.id));

    if (van.driverId !== input.requesterId) {
      return left(new NotVanOwnerError(input.id));
    }

    const studentsInVan = await this.studentRepository.listByVanId(input.id);
    for (const student of studentsInVan) {
      await this.studentRepository.update(student.unlinkFromVan());
    }

    await this.vanRepository.delete(input.id);

    return right({ deleted: true });
  }
}
