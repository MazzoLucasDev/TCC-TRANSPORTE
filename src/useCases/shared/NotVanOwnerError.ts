export class NotVanOwnerError extends Error {
  constructor(vanId: string) {
    super(`Você não tem permissão para alterar esta van: ${vanId}`);
    this.name = "NotVanOwnerError";
  }
}
