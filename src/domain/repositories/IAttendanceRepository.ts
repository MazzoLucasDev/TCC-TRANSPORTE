import type { Attendance } from "../entities/attendence/Attendance.js";

export interface IAttendanceRepository {
  findById(id: string): Promise<Attendance | null>;
  findByStudentAndDate(
    studentId: string,
    date: Date,
  ): Promise<Attendance | null>; //precisa saber se já existe registro daquele aluno naquele dia antes de decidir se cria um novo ou atualiza o existente.
  findByVanAndDate(vanId: string, date: Date): Promise<Attendance | null>; // é o que alimenta o algoritmo de rota
  create(attendence: Attendance): Promise<void>;
  update(attendence: Attendance): Promise<void>;
  listAll(): Promise<Attendance[]>;
  delete(id: string): Promise<void>;
}
