import { left, right, type Either } from "../../shared/Either.js";
import { InvalidCollectionPointError } from "../erorrs/InvalidCollectionPointError.js";

export type CollectionPointData = {
  lat: number;
  long: number;
};
const BRASIL_LAT_MIN = -33.75;
const BRASIL_LAT_MAX = 5.27;
const BRASIL_LNG_MIN = -73.99;
const BRASIL_LNG_MAX = -28.84;
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
    if (lat < BRASIL_LAT_MIN || lat > BRASIL_LAT_MAX) {
      return false;
    }
    if (long < BRASIL_LNG_MIN || long > BRASIL_LNG_MAX) {
      return false;
    }
    return true;
  }

  get value(): CollectionPointData {
    return { lat: this.lat, long: this.long };
  }
}
