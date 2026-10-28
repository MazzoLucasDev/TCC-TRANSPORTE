import type { Student } from "../../domain/entities/student/Student.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { NotVanOwnerError } from "../shared/NotVanOwnerError.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import type { UseCase } from "../useCase.js";

export type ListConfirmedAttendanceInputDto = {
  vanId: string;
  requesterId: string;
  date: string;
};

export type ListConfirmedAttendanceOutputDto = {
  confirmedStudents: Array<{
    studentId: string;
    collectionPoint: { lat: number; long: number };
  }>;
};

export type ListConfirmedAttendanceError = VanNotFoundError | NotVanOwnerError;

export class ListConfirmedAttendanceUseCase implements UseCase<
  ListConfirmedAttendanceInputDto,
  Either<ListConfirmedAttendanceError, ListConfirmedAttendanceOutputDto>
> {
  private constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly attendanceRepository: IAttendanceRepository,
    private readonly vanRepository: IVanRepository,
  ) {}

  public static create(
    studentRepository: IStudentRepository,
    attendanceRepository: IAttendanceRepository,
    vanRepository: IVanRepository,
  ) {
    return new ListConfirmedAttendanceUseCase(
      studentRepository,
      attendanceRepository,
      vanRepository,
    );
  }
  public async execute(
    input: ListConfirmedAttendanceInputDto,
  ): Promise<
    Either<ListConfirmedAttendanceError, ListConfirmedAttendanceOutputDto>
  > {
    const van = await this.vanRepository.findById(input.vanId);
    if (!van) {
      return left(new VanNotFoundError(input.vanId));
    }
    if (van.driverId !== input.requesterId) {
      return left(new NotVanOwnerError(input.vanId));
    }

    const allStudentInVan = await this.studentRepository.listByVanId(
      input.vanId,
    );

    const parsedDate = new Date(input.date);
    const attendancesOfDay = await this.attendanceRepository.listByVanAndDate(
      input.vanId,
      parsedDate,
    );

    const absentStudentIds = new Set(
      attendancesOfDay
        .filter((attendance) => attendance.status === "ABSENT")
        .map((attendance) => attendance.studentId),
    );

    const confirmedStudents = allStudentInVan.filter(
      (student) => !absentStudentIds.has(student.id),
    );
    return right(this.presentOutput(confirmedStudents));
  }

  private presentOutput(students: Student[]): ListConfirmedAttendanceOutputDto {
    return {
      confirmedStudents: students.map((student) => ({
        studentId: student.id,
        collectionPoint: student.collectionPoint.value,
      })),
    };
  }
}
