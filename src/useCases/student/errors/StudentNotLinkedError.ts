export class StudentNotLinkedError extends Error {
  constructor(studentId: string) {
    super(`Aluno não está vinculado a nenhuma van: ${studentId}`);
    this.name = "StudentNotLinkedError";
  }
}
