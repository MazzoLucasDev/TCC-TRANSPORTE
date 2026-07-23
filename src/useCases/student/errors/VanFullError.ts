export class VanFullError extends Error {
  constructor(vanId: string) {
    super(`Van sem vagas disponíveis: ${vanId}`);
    this.name = "VanFullError";
  }
}
