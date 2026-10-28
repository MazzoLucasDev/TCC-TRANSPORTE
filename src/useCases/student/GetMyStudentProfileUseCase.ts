import type { Attendance } from "../../domain/entities/attendance/Attendance.js";
import type { Student } from "../../domain/entities/student/Student.js";
import type { User } from "../../domain/entities/user/User.js";
import type { Van } from "../../domain/entities/van/Van.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import type { UseCase } from "../useCase.js";
import { StudentNotFoundError } from "./errors/StudentNotFoundError.js";
import { UserNotFoundError } from "../shared/UserNotFoundError.js";

export type GetMyStudentProfileInputDto = {
  requesterId: string; // userId vindo do token
  date: string; // AAAA-MM-DD: dia cuja presença será consultada
};

export type GetMyStudentProfileOutputDto = {
  studentId: string;
  name: string;
  phone: string;
  collectionPoint: { lat: number; long: number };
  van: {
    id: string;
    model: string;
    period: string;
    destiny: string;
    emTrajeto: boolean;
    driver: { name: string; phone: string } | null;
  } | null;
  attendance: { date: string; status: "PRESENT" | "ABSENT" };
};

export type GetMyStudentProfileError = StudentNotFoundError | UserNotFoundError;

/**
 * Tudo o que a tela inicial do aluno precisa em uma chamada: dados do aluno,
 * van vinculada (com contato do motorista) e status de presença do dia.
 * O aluno é identificado pelo token, nunca por um id enviado pelo cliente.
 */
export class GetMyStudentProfileUseCase implements UseCase<
  GetMyStudentProfileInputDto,
  Either<GetMyStudentProfileError, GetMyStudentProfileOutputDto>
> {
  private constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly userRepository: IUserRepository,
    private readonly vanRepository: IVanRepository,
    private readonly attendanceRepository: IAttendanceRepository,
  ) {}

  public static create(
    studentRepository: IStudentRepository,
    userRepository: IUserRepository,
    vanRepository: IVanRepository,
    attendanceRepository: IAttendanceRepository,
  ) {
    return new GetMyStudentProfileUseCase(
      studentRepository,
      userRepository,
      vanRepository,
      attendanceRepository,
    );
  }

  public async execute(
    input: GetMyStudentProfileInputDto,
  ): Promise<Either<GetMyStudentProfileError, GetMyStudentProfileOutputDto>> {
    const student = await this.studentRepository.findByUserId(
      input.requesterId,
    );
    if (!student) {
      return left(new StudentNotFoundError(input.requesterId));
    }

    const user = await this.userRepository.findById(student.userId);
    if (!user) {
      return left(new UserNotFoundError(student.userId));
    }

    const van = student.vanId
      ? await this.vanRepository.findById(student.vanId)
      : null;
    const driver = van
      ? await this.userRepository.findById(van.driverId)
      : null;

    const attendance = await this.attendanceRepository.findByStudentAndDate(
      student.id,
      new Date(input.date),
    );

    return right(
      this.presentOutput(student, user, van, driver, attendance, input.date),
    );
  }

  private presentOutput(
    student: Student,
    user: User,
    van: Van | null,
    driver: User | null,
    attendance: Attendance | null,
    date: string,
  ): GetMyStudentProfileOutputDto {
    return {
      studentId: student.id,
      name: user.name.value,
      phone: user.phone.value,
      collectionPoint: student.collectionPoint.value,
      van: van
        ? {
            id: van.id,
            model: van.model.value,
            period: van.period.value,
            destiny: van.destiny.value,
            emTrajeto: van.emTrajeto,
            driver: driver
              ? { name: driver.name.value, phone: driver.phone.value }
              : null,
          }
        : null,
      // Sem registro no dia, o aluno é considerado presente (padrão do sistema).
      attendance: {
        date,
        status: attendance ? attendance.status : "PRESENT",
      },
    };
  }
}
