export class VanNotFoundError extends Error {
  constructor(vanId: string) {
    super(`Van não encontrada: ${vanId}`);
    this.name = "VanNotFoundError";
  }
}
