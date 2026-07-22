export class UserIsNotDriverError extends Error {
  constructor(idUser: string) {
    super(`Usuário não é motorista: ${idUser}`);
    this.name = "UserIsNotDriverError";
  }
}
