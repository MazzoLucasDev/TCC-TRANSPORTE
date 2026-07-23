export class StudentNotFoundError extends Error {
  constructor(studentId: string) {
    super(`Aluno não encontrado: ${studentId}`);
    this.name = "StudentNotFoundError";
  }
}
