import { left, right, type Either } from "../Either.js";
import { InvalidCoordinatesError } from "../errors/InvalidCoordinatesError.js";

export type CoordinatesData = {
  lat: number;
  long: number;
};
const BRASIL_LAT_MIN = -33.75;
const BRASIL_LAT_MAX = 5.27;
const BRASIL_LNG_MIN = -73.99;
const BRASIL_LNG_MAX = -28.84;
export class Coordinates {
  private constructor(
    private readonly lat: number,
    private readonly long: number,
  ) {
    Object.freeze(this);
  }

  static create(
    data: CoordinatesData,
  ): Either<InvalidCoordinatesError, Coordinates> {
    if (!Coordinates.validate(data)) {
      return left(new InvalidCoordinatesError(data.lat, data.long));
    }
    return right(new Coordinates(data.lat, data.long));
  }
  static validate(data: CoordinatesData): boolean {
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

  static restore(data: CoordinatesData): Coordinates {
    return new Coordinates(data.lat, data.long);
  }

  get value(): CoordinatesData {
    return { lat: this.lat, long: this.long };
  }
}
