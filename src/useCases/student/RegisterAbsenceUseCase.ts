import {
  Attendance,
  type AttendanceError,
} from "../../domain/entities/attendance/Attendance.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import type { UseCase } from "../useCase.js";
import { StudentNotFoundError } from "./errors/StudentNotFoundError.js";

export type RegisterAbsenceInputDto = {
  studentId: string;
  date: string;
};

export type RegisterAbsenceOutputDto = {
  attendenceId: string;
  studentId: string;
  date: string;
  status: string;
};

export type RegisterAbsenceError = StudentNotFoundError | AttendanceError;

export class RegisterAbsenceUseCase implements UseCase<
  RegisterAbsenceInputDto,
  Either<RegisterAbsenceError, RegisterAbsenceOutputDto>
> {
  private constructor(
    private readonly attendanceRepository: IAttendanceRepository,
    private readonly studentRepository: IStudentRepository,
  ) {}

  public static create(
    attendanceRepository: IAttendanceRepository,
    studentRepository: IStudentRepository,
  ) {
    return new RegisterAbsenceUseCase(attendanceRepository, studentRepository);
  }

  public async execute(
    input: RegisterAbsenceInputDto,
  ): Promise<Either<RegisterAbsenceError, RegisterAbsenceOutputDto>> {
    const student = await this.studentRepository.findById(input.studentId);
    if (!student) {
      return left(new StudentNotFoundError(input.studentId));
    }

    const parsedDate = new Date(input.date);
    const existingAttendance =
      await this.attendanceRepository.findByStudentAndDate(
        input.studentId,
        parsedDate,
      );
    if (existingAttendance) {
      const absentAttendence = existingAttendance.markAsAbsent();
      await this.attendanceRepository.update(absentAttendence);
      return right(this.presentOutput(absentAttendence));
    }
    const attendanceOrError = Attendance.create({
      studentId: input.studentId,
      date: input.date,
      status: "ABSENT",
    });
    if (attendanceOrError.isLeft()) {
      return left(attendanceOrError.value);
    }

    const attendance = attendanceOrError.value;
    await this.attendanceRepository.create(attendance);

    return right(this.presentOutput(attendance));
  }

  private presentOutput(attendance: Attendance): RegisterAbsenceOutputDto {
    return {
      attendenceId: attendance.id,
      studentId: attendance.studentId,
      date: attendance.date.toISOString(),
      status: attendance.status,
    };
  }
}
