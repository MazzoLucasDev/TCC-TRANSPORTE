export class VanNotInTripError extends Error {
  constructor(vanId: string) {
    super(`A van não está em trajeto: ${vanId}`);
    this.name = "VanNotInTripError";
  }
}
