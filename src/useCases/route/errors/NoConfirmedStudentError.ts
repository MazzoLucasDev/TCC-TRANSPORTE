export class NoConfirmedStudentsError extends Error {
  constructor(vanId: string, date: string) {
    super(`Nenhum aluno confirmado para a van ${vanId} na data ${date}`);
    this.name = "NoConfirmedStudentsError";
  }
}
