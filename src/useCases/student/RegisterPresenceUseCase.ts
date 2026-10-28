import type { Student } from "../../domain/entities/student/Student.js";
import { InvalidAttendanceDateError } from "../../domain/entities/attendance/errors/InvalidAttendanceError.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { NotStudentOwnerError } from "../shared/NotStudentOwnerError.js";
import type { UseCase } from "../useCase.js";
import { StudentNotFoundError } from "./errors/StudentNotFoundError.js";

export type RegisterPresenceInputDto = {
  studentId: string;
  requesterId: string;
  date: string;
};

export type RegisterPresenceOutputDto = {
  studentId: string;
  date: string;
  status: "PRESENT";
};

export type RegisterPresenceError =
  | StudentNotFoundError
  | NotStudentOwnerError
  | InvalidAttendanceDateError;

/**
 * Desfaz uma ausência. Sem registro para o dia, o aluno já é considerado
 * presente (é o padrão em ListConfirmedAttendanceUseCase), então nada é gravado.
 */
export class RegisterPresenceUseCase implements UseCase<
  RegisterPresenceInputDto,
  Either<RegisterPresenceError, RegisterPresenceOutputDto>
> {
  private constructor(
    private readonly attendanceRepository: IAttendanceRepository,
    private readonly studentRepository: IStudentRepository,
  ) {}

  public static create(
    attendanceRepository: IAttendanceRepository,
    studentRepository: IStudentRepository,
  ) {
    return new RegisterPresenceUseCase(attendanceRepository, studentRepository);
  }

  public async execute(
    input: RegisterPresenceInputDto,
  ): Promise<Either<RegisterPresenceError, RegisterPresenceOutputDto>> {
    const student = await this.studentRepository.findById(input.studentId);
    if (!student) {
      return left(new StudentNotFoundError(input.studentId));
    }
    if (student.userId !== input.requesterId) {
      return left(new NotStudentOwnerError(input.studentId));
    }

    const parsedDate = new Date(input.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return left(new InvalidAttendanceDateError(input.date));
    }

    const existing = await this.attendanceRepository.findByStudentAndDate(
      input.studentId,
      parsedDate,
    );
    if (existing && !existing.isPresent()) {
      await this.attendanceRepository.update(existing.markAsPresent());
    }

    return right(this.presentOutput(student, parsedDate));
  }

  private presentOutput(
    student: Student,
    date: Date,
  ): RegisterPresenceOutputDto {
    return {
      studentId: student.id,
      date: date.toISOString(),
      status: "PRESENT",
    };
  }
}
