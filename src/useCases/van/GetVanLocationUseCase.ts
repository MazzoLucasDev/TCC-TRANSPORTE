import type { VanLocation } from "../../domain/entities/van/VanLocation.js";
import type { Van } from "../../domain/entities/van/Van.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IVanLocationRepository } from "../../domain/repositories/IVanLocationRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import { NotVanMemberError } from "../shared/NotVanMemberError.js";
import type { UseCase } from "../useCase.js";

export type GetVanLocationInputDto = {
  vanId: string;
  requesterId: string;
};

export type GetVanLocationOutputDto = {
  vanId: string;
  emTrajeto: boolean;
  // null quando a van não está em trajeto ou ainda não enviou a posição
  location: {
    lat: number;
    long: number;
    updatedAt: string;
    stale: boolean; // true = sem sinal (posição antiga demais)
  } | null;
};

export type GetVanLocationError = VanNotFoundError | NotVanMemberError;

export class GetVanLocationUseCase implements UseCase<
  GetVanLocationInputDto,
  Either<GetVanLocationError, GetVanLocationOutputDto>
> {
  private constructor(
    private readonly vanRepository: IVanRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly vanLocationRepository: IVanLocationRepository,
  ) {}

  public static create(
    vanRepository: IVanRepository,
    studentRepository: IStudentRepository,
    vanLocationRepository: IVanLocationRepository,
  ) {
    return new GetVanLocationUseCase(
      vanRepository,
      studentRepository,
      vanLocationRepository,
    );
  }

  public async execute(
    input: GetVanLocationInputDto,
  ): Promise<Either<GetVanLocationError, GetVanLocationOutputDto>> {
    const van = await this.vanRepository.findById(input.vanId);
    if (!van) {
      return left(new VanNotFoundError(input.vanId));
    }

    if (van.driverId !== input.requesterId) {
      const student = await this.studentRepository.findByUserId(
        input.requesterId,
      );
      if (!student || student.vanId !== van.id) {
        return left(new NotVanMemberError(input.vanId));
      }
    }

    const location = van.emTrajeto
      ? await this.vanLocationRepository.findByVanId(van.id)
      : null;

    return right(this.presentOutput(van, location));
  }

  private presentOutput(
    van: Van,
    location: VanLocation | null,
  ): GetVanLocationOutputDto {
    return {
      vanId: van.id,
      emTrajeto: van.emTrajeto,
      location: location
        ? {
            ...location.coordinates.value,
            updatedAt: location.updatedAt.toISOString(),
            stale: location.isStale(),
          }
        : null,
    };
  }
}
