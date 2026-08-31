import { Capacity } from "../../domain/entities/van/valueObjects/Capacity.js";
import { Destiny } from "../../domain/entities/van/valueObjects/Destiny.js";
import { Model } from "../../domain/entities/van/valueObjects/Model.js";
import { Period } from "../../domain/entities/van/valueObjects/Period.js";
import { Year } from "../../domain/entities/van/valueObjects/Year.js";
import { Van, type VanError } from "../../domain/entities/van/Van.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import type { UseCase } from "../useCase.js";
import { NotVanOwnerError } from "../shared/NotVanOwnerError.js";

export type UpdateVanInputDto = {
  vanId: string;
  requesterId: string;
  model: string;
  year: number;
  period: string;
  destiny: string;
  capacity: number;
};

export type UpdateVanOutputDto = {
  id: string;
  model: string;
  capacity: number;
};

export type UpdateVanErrors = VanNotFoundError | VanError | NotVanOwnerError;

export class UpdateVanUseCase implements UseCase<
  UpdateVanInputDto,
  Either<UpdateVanErrors, UpdateVanOutputDto>
> {
  private constructor(private readonly vanRepository: IVanRepository) {}

  public static create(vanRepository: IVanRepository) {
    return new UpdateVanUseCase(vanRepository);
  }

  public async execute(
    input: UpdateVanInputDto,
  ): Promise<Either<UpdateVanErrors, UpdateVanOutputDto>> {
    const existingVan = await this.vanRepository.findById(input.vanId);
    if (!existingVan) {
      return left(new VanNotFoundError(input.vanId));
    }
    if (existingVan.driverId !== input.requesterId) {
      return left(new NotVanOwnerError(input.vanId));
    }

    const modelOrError = Model.create(input.model);
    if (modelOrError.isLeft()) return left(modelOrError.value);

    const yearOrError = Year.create(input.year);
    if (yearOrError.isLeft()) return left(yearOrError.value);

    const periodOrError = Period.create(input.period);
    if (periodOrError.isLeft()) return left(periodOrError.value);

    const destinyOrError = Destiny.create(input.destiny);
    if (destinyOrError.isLeft()) return left(destinyOrError.value);

    const capacityOrError = Capacity.create(input.capacity);
    if (capacityOrError.isLeft()) return left(capacityOrError.value);

    const updatedVan = existingVan.withUpdatedDetails({
      model: modelOrError.value,
      year: yearOrError.value,
      period: periodOrError.value,
      destiny: destinyOrError.value,
      capacity: capacityOrError.value,
    });

    await this.vanRepository.update(updatedVan);

    return right(this.presentOutput(updatedVan));
  }

  private presentOutput(van: Van): UpdateVanOutputDto {
    return { id: van.id, model: van.model.value, capacity: van.capacity.value };
  }
}
