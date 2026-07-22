export class DriverNotFoundError extends Error {
  constructor(driverId: string) {
    super(`Motorista não encontrado: ${driverId}`);
    this.name = "DriverNotFoundError";
  }
}
