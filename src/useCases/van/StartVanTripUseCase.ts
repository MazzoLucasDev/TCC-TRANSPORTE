import type { Van } from "../../domain/entities/van/Van.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import { NotVanOwnerError } from "../shared/NotVanOwnerError.js";
import type { UseCase } from "../useCase.js";

export type StartVanTripInputDto = {
  vanId: string;
  requesterId: string;
};

export type StartVanTripOutputDto = {
  id: string;
  emTrajeto: boolean;
};

export type StartVanTripError = VanNotFoundError | NotVanOwnerError;

export class StartVanTripUseCase implements UseCase<
  StartVanTripInputDto,
  Either<StartVanTripError, StartVanTripOutputDto>
> {
  private constructor(private readonly vanRepository: IVanRepository) {}

  public static create(vanRepository: IVanRepository) {
    return new StartVanTripUseCase(vanRepository);
  }

  public async execute(
    input: StartVanTripInputDto,
  ): Promise<Either<StartVanTripError, StartVanTripOutputDto>> {
    const van = await this.vanRepository.findById(input.vanId);
    if (!van) {
      return left(new VanNotFoundError(input.vanId));
    }
    if (van.driverId !== input.requesterId) {
      return left(new NotVanOwnerError(input.vanId));
    }

    const updatedVan = van.alterarStatusTrajeto(true);
    await this.vanRepository.update(updatedVan);

    return right(this.presentOutput(updatedVan));
  }

  private presentOutput(van: Van): StartVanTripOutputDto {
    return { id: van.id, emTrajeto: van.emTrajeto };
  }
}
