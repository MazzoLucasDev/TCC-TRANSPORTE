import { left, right, type Either } from "../../shared/Either.js";
import { InvalidUserIdError } from "../../shared/errors/InvalidUserIdError.js";
import type { AttendanceData } from "./AttendanceData.js";
import { InvalidAttendanceDateError } from "./errors/InvalidAttendanceError.js";

export type AttendanceStatus = "PRESENT" | "ABSENT";

export type AttendanceProps = {
  readonly id: string;
  readonly studentId: string;
  readonly date: Date;
  status: AttendanceStatus;
};

export type AttendanceError = InvalidUserIdError | InvalidAttendanceDateError;

export class Attendance {
  private constructor(private readonly props: AttendanceProps) {
    Object.freeze(this);
  }

  public static create(
    AttendanceData: AttendanceData,
  ): Either<AttendanceError, Attendance> {
    if (!AttendanceData.studentId || AttendanceData.studentId.length === 0) {
      return left(new InvalidUserIdError(AttendanceData.studentId));
    }
    const parsedDate = new Date(AttendanceData.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return left(new InvalidAttendanceDateError(AttendanceData.date));
    }
    return right(
      new Attendance({
        id: crypto.randomUUID(),
        studentId: AttendanceData.studentId,
        date: parsedDate,
        status: AttendanceData.status ?? "PRESENT",
      }),
    );
  }
  get id(): string {
    return this.props.id;
  }

  get studentId(): string {
    return this.props.studentId;
  }

  get date(): Date {
    return this.props.date;
  }

  get status(): AttendanceStatus {
    return this.props.status;
  }
  markAsAbsent(): Attendance {
    return new Attendance({ ...this.props, status: "ABSENT" });
  }

  markAsPresent(): Attendance {
    return new Attendance({ ...this.props, status: "PRESENT" });
  }
  isPresent(): boolean {
    return this.props.status === "PRESENT";
  }
}
