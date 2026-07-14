import type { Student } from "../entities/student/Student.js";

export interface IStudentRepository {
  findById(id: string): Promise<Student | null>;
  findByUserId(userId: string): Promise<Student | null>;
  create(student: Student): Promise<void>;
  update(student: Student): Promise<void>;
  listAll(): Promise<Student[]>;
  delete(id: string): Promise<void>;
}
