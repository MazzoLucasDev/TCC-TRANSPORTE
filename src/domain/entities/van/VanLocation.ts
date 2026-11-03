import { left, right, type Either } from "../../shared/Either.js";
import type { InvalidCoordinatesError } from "../../shared/errors/InvalidCoordinatesError.js";
import { Coordinates } from "../../shared/valueObjects/Coordinates.js";
import type { VanLocationData } from "./VanLocationData.js";

// Passado esse tempo sem uma nova posição, o app do aluno mostra "sem sinal".
export const LOCATION_MAX_AGE_MS = 30_000;

export type VanLocationProps = {
  readonly vanId: string;
  readonly coordinates: Coordinates;
  readonly updatedAt: Date;
};

export type VanLocationError = InvalidCoordinatesError;

export class VanLocation {
  private constructor(private readonly props: VanLocationProps) {
    Object.freeze(this);
  }

  public static create(
    data: VanLocationData,
    updatedAt: Date = new Date(),
  ): Either<VanLocationError, VanLocation> {
    const coordinatesOrError = Coordinates.create({
      lat: data.lat,
      long: data.long,
    });
    if (coordinatesOrError.isLeft()) {
      return left(coordinatesOrError.value);
    }

    return right(
      new VanLocation({
        vanId: data.vanId,
        coordinates: coordinatesOrError.value,
        updatedAt,
      }),
    );
  }

  get vanId(): string {
    return this.props.vanId;
  }

  get coordinates(): Coordinates {
    return this.props.coordinates;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isStale(now: Date = new Date()): boolean {
    return now.getTime() - this.props.updatedAt.getTime() > LOCATION_MAX_AGE_MS;
  }
}
