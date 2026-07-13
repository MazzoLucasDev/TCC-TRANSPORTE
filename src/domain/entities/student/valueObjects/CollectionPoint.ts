import { left, right, type Either } from "../../shared/Either.js";
import { InvalidCollectionPointError } from "../Errors/InvalidCollectionPointError.js";

export type CollectionPointData = {
  lat: number;
  long: number;
};

export class CollectionPoint {
  private constructor(
    private readonly long: number,
    private readonly lat: number,
  ) {
    Object.freeze(this);
  }

  static create(
    data: CollectionPointData,
  ): Either<InvalidCollectionPointError, CollectionPoint> {
    if (!CollectionPoint.validate(data)) {
      return left(new InvalidCollectionPointError(data.lat, data.long));
    }
    return right(new CollectionPoint(data.lat, data.long));
  }
  static validate(data: CollectionPointData): boolean {
    const { lat, long } = data;
    if (typeof lat !== "number" || typeof long !== "number") {
      return false;
    }
    if (Number.isNaN(lat) || Number.isNaN(long)) {
      return false;
    }
    if (lat < -90 || lat > 90) {
      return false;
    }
    if (long < -180 || long > 180) {
      return false;
    }

    if (lat === 0 && long === 0) {
      return false;
    }
    return true;
  }

  get value(): CollectionPointData {
    return { lat: this.lat, long: this.long };
  }
}
