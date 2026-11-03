import {
  VanLocation,
  type VanLocationError,
} from "../../domain/entities/van/VanLocation.js";
import type { IVanLocationRepository } from "../../domain/repositories/IVanLocationRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import { NotVanOwnerError } from "../shared/NotVanOwnerError.js";
import type { UseCase } from "../useCase.js";
import { VanNotInTripError } from "./errors/VanNotInTripError.js";

export type UpdateVanLocationInputDto = {
  vanId: string;
  requesterId: string;
  lat: number;
  long: number;
};

export type UpdateVanLocationOutputDto = {
  vanId: string;
  lat: number;
  long: number;
  updatedAt: string;
};

export type UpdateVanLocationError =
  | VanNotFoundError
  | NotVanOwnerError
  | VanNotInTripError
  | VanLocationError;

export class UpdateVanLocationUseCase implements UseCase<
  UpdateVanLocationInputDto,
  Either<UpdateVanLocationError, UpdateVanLocationOutputDto>
> {
  private constructor(
    private readonly vanRepository: IVanRepository,
    private readonly vanLocationRepository: IVanLocationRepository,
  ) {}

  public static create(
    vanRepository: IVanRepository,
    vanLocationRepository: IVanLocationRepository,
  ) {
    return new UpdateVanLocationUseCase(vanRepository, vanLocationRepository);
  }

  public async execute(
    input: UpdateVanLocationInputDto,
  ): Promise<Either<UpdateVanLocationError, UpdateVanLocationOutputDto>> {
    const van = await this.vanRepository.findById(input.vanId);
    if (!van) {
      return left(new VanNotFoundError(input.vanId));
    }
    if (van.driverId !== input.requesterId) {
      return left(new NotVanOwnerError(input.vanId));
    }
    if (!van.emTrajeto) {
      return left(new VanNotInTripError(input.vanId));
    }

    const locationOrError = VanLocation.create({
      vanId: van.id,
      lat: input.lat,
      long: input.long,
    });
    if (locationOrError.isLeft()) {
      return left(locationOrError.value);
    }

    const location = locationOrError.value;
    await this.vanLocationRepository.save(location);

    return right(this.presentOutput(location));
  }

  private presentOutput(location: VanLocation): UpdateVanLocationOutputDto {
    const { lat, long } = location.coordinates.value;
    return {
      vanId: location.vanId,
      lat,
      long,
      updatedAt: location.updatedAt.toISOString(),
    };
  }
}
