export class InvalidUserIdError extends Error {
  constructor(userId: string) {
    super(`UserId inválido: ${userId}`);
    this.name = "InvalidUserIdError";
  }
}
