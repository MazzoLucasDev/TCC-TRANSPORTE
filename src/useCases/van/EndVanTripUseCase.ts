import type { Van } from "../../domain/entities/van/Van.js";
import type { IVanLocationRepository } from "../../domain/repositories/IVanLocationRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import { NotVanOwnerError } from "../shared/NotVanOwnerError.js";
import type { UseCase } from "../useCase.js";

export type EndVanTripInputDto = {
  vanId: string;
  requesterId: string;
};

export type EndVanTripOutputDto = {
  id: string;
  emTrajeto: boolean;
};

export type EndVanTripError = VanNotFoundError | NotVanOwnerError;

export class EndVanTripUseCase implements UseCase<
  EndVanTripInputDto,
  Either<EndVanTripError, EndVanTripOutputDto>
> {
  private constructor(
    private readonly vanRepository: IVanRepository,
    private readonly vanLocationRepository: IVanLocationRepository,
  ) {}

  public static create(
    vanRepository: IVanRepository,
    vanLocationRepository: IVanLocationRepository,
  ) {
    return new EndVanTripUseCase(vanRepository, vanLocationRepository);
  }

  public async execute(
    input: EndVanTripInputDto,
  ): Promise<Either<EndVanTripError, EndVanTripOutputDto>> {
    const van = await this.vanRepository.findById(input.vanId);
    if (!van) {
      return left(new VanNotFoundError(input.vanId));
    }
    if (van.driverId !== input.requesterId) {
      return left(new NotVanOwnerError(input.vanId));
    }

    const updatedVan = van.alterarStatusTrajeto(false);
    await this.vanRepository.update(updatedVan);
    // Trajeto encerrado: a última posição não deve mais ser exibida.
    await this.vanLocationRepository.delete(van.id);

    return right(this.presentOutput(updatedVan));
  }

  private presentOutput(van: Van): EndVanTripOutputDto {
    return { id: van.id, emTrajeto: van.emTrajeto };
  }
}
