export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`Usuário não encontrado: ${userId}`);
    this.name = "UserNotFoundError";
  }
}
