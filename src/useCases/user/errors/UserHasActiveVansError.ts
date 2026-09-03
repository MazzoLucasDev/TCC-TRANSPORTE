export class UserHasActiveVansError extends Error {
  constructor(userId: string) {
    super(
      `Não é possível excluir o usuário: ele possui vans cadastradas. Exclua as vans primeiro. (userId: ${userId})`,
    );
    this.name = "UserHasActiveVansError";
  }
}
