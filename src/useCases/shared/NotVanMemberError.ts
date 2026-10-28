export class NotVanMemberError extends Error {
  constructor(vanId: string) {
    super(`Você não pertence a esta van: ${vanId}`);
    this.name = "NotVanMemberError";
  }
}
