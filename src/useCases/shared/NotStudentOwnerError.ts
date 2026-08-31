export class NotStudentOwnerError extends Error {
  constructor(studentId: string) {
    super(`Você não tem permissão para alterar este aluno: ${studentId}`);
    this.name = "NotStudentOwnerError";
  }
}
