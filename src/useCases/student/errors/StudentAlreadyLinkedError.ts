export class StudentAlreadyLinkedError extends Error {
  constructor(studentId: string) {
    super(`Aluno já está vinculado a uma van: ${studentId}`);
    this.name = "StudentAlreadyLinkedError";
  }
}
