import type { Student } from "../../domain/entities/student/Student.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { UseCase } from "../useCase.js";

export type ListConfirmedAttendanceInputDto = {
  vanId: string;
  date: string;
};

export type ListConfirmedAttendanceOutputDto = {
  confirmedStudents: Array<{
    studentId: string;
    collectionPoint: { lat: number; long: number };
  }>;
};

export class ListConfirmedAttendanceUseCase implements UseCase<
  ListConfirmedAttendanceInputDto,
  ListConfirmedAttendanceOutputDto
> {
  private constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly attendanceRepository: IAttendanceRepository,
  ) {}

  public static create(
    studentRepository: IStudentRepository,
    attendanceRepository: IAttendanceRepository,
  ) {
    return new ListConfirmedAttendanceUseCase(
      studentRepository,
      attendanceRepository,
    );
  }
  public async execute(
    input: ListConfirmedAttendanceInputDto,
  ): Promise<ListConfirmedAttendanceOutputDto> {
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
    return this.presentOutput(confirmedStudents);
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
