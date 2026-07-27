import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import type { IRouteRepository } from "../../domain/repositories/IRouteRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import type { IRouteCalculatorService } from "../../domain/services/IRouteCalculatorService.js";
import type { Either } from "../../domain/shared/Either.js";
import type { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import type { UseCase } from "../useCase.js";
import type { NoConfirmedStudentsError } from "./errors/NoConfirmedStudentError.js";

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
}
