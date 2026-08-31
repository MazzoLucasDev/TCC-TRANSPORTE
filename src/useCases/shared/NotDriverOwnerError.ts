export class NotDriverOwnerError extends Error {
  constructor(driverId: string) {
    super(`Você não tem permissão para alterar este motorista: ${driverId}`);
    this.name = "NotDriverOwnerError";
  }
}
