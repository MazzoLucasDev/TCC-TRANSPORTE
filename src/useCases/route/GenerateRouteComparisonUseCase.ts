import { Route } from "../../domain/entities/route/Route.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import type { IRouteRepository } from "../../domain/repositories/IRouteRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import type {
  IRouteCalculatorService,
  RouteCalculatorResult,
  RoutePoint,
} from "../../domain/services/IRouteCalculatorService.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import type { UseCase } from "../useCase.js";
import { NoConfirmedStudentsError } from "./errors/NoConfirmedStudentError.js";

export type GenerateRouteComparisonUseCaseInputDto = {
  vanId: string;
  date: string;
  driverLocation: { lat: number; long: number };
};

export type RouteResultDto = {
  studentOrder: string[];
  distanceKm: number;
  durationMin: number;
};

export type GenerateRouteComparisonUseCaseOutputDto = {
  simpleRoute: RouteResultDto;
  optimizedRoute: RouteResultDto;
};

export type GenerateRouteComparisonError =
  | VanNotFoundError
  | NoConfirmedStudentsError;

export class GenerateRouteComparisonUseCase implements UseCase<
  GenerateRouteComparisonUseCaseInputDto,
  Either<GenerateRouteComparisonError, GenerateRouteComparisonUseCaseOutputDto>
> {
  private constructor(
    private readonly vanRepository: IVanRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly attendanceRepository: IAttendanceRepository,
    private readonly routeRepository: IRouteRepository,
    private readonly routeCalculator: IRouteCalculatorService,
  ) {}

  public static create(
    vanRepository: IVanRepository,
    studentRepository: IStudentRepository,
    attendanceRepository: IAttendanceRepository,
    routeRepository: IRouteRepository,
    routeCalculator: IRouteCalculatorService,
  ) {
    return new GenerateRouteComparisonUseCase(
      vanRepository,
      studentRepository,
      attendanceRepository,
      routeRepository,
      routeCalculator,
    );
  }

  public async execute(
    input: GenerateRouteComparisonUseCaseInputDto,
  ): Promise<
    Either<
      GenerateRouteComparisonError,
      GenerateRouteComparisonUseCaseOutputDto
    >
  > {
    const van = await this.vanRepository.findById(input.vanId);
    if (!van) {
      return left(new VanNotFoundError(input.vanId));
    }
    const confirmedPoints = await this.getConfirmedStudentPoints(
      input.vanId,
      input.date,
    );
    if (confirmedPoints.length === 0) {
      return left(new NoConfirmedStudentsError(input.vanId, input.date));
    }

    const parsedDate = new Date(input.date);

    const simpleResult = this.routeCalculator.calculateFixedOrder(
      input.driverLocation,
      confirmedPoints,
    );

    const optimizedResult = this.routeCalculator.calculateOptimized(
      input.driverLocation,
      confirmedPoints,
    );

    const simpleRouteOrError = Route.create({
      vanId: input.vanId,
      date: parsedDate,
      type: "SIMPLE",
      studentOrder: simpleResult.order,
      distanceKm: simpleResult.distanceKm,
      durationMin: simpleResult.durationMin,
    });
    const optimizedRouteOrError = Route.create({
      vanId: input.vanId,
      date: parsedDate,
      type: "OPTIMIZED",
      studentOrder: optimizedResult.order,
      distanceKm: optimizedResult.distanceKm,
      durationMin: optimizedResult.durationMin,
    });
    if (simpleRouteOrError.isRight()) {
      await this.routeRepository.create(simpleRouteOrError.value);
    }
    if (optimizedRouteOrError.isRight()) {
      await this.routeRepository.create(optimizedRouteOrError.value);
    }

    return right(this.presentOutput(simpleResult, optimizedResult));
  }

  private async getConfirmedStudentPoints(
    vanId: string,
    date: string,
  ): Promise<RoutePoint[]> {
    const allStudents = await this.studentRepository.listByVanId(vanId);
    const attendanceOfDay = await this.attendanceRepository.listByVanAndDate(
      vanId,
      new Date(date),
    );

    const absentStudentsIds = new Set(
      attendanceOfDay
        .filter((attendance) => attendance.status === "ABSENT")
        .map((attendance) => attendance.studentId),
    );
    return allStudents
      .filter((student) => !absentStudentsIds.has(student.id))
      .map((student) => ({
        studentId: student.id,
        lat: student.collectionPoint.value.lat,
        long: student.collectionPoint.value.long,
      }));
  }

  private presentOutput(
    simpleResult: RouteCalculatorResult,
    optimizedResult: RouteCalculatorResult,
  ): GenerateRouteComparisonUseCaseOutputDto {
    return {
      simpleRoute: {
        studentOrder: simpleResult.order,
        distanceKm: simpleResult.distanceKm,
        durationMin: simpleResult.durationMin,
      },
      optimizedRoute: {
        studentOrder: optimizedResult.order,
        distanceKm: optimizedResult.distanceKm,
        durationMin: optimizedResult.durationMin,
      },
    };
  }
}
