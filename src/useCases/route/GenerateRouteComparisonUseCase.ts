import { Route } from "../../domain/entities/route/Route.js";
import type { Student } from "../../domain/entities/student/Student.js";
import type { IAttendanceRepository } from "../../domain/repositories/IAttendanceRepository.js";
import type { IRouteRepository } from "../../domain/repositories/IRouteRepository.js";
import type { IStudentRepository } from "../../domain/repositories/IStudentRepository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import type {
  GeoPoint,
  IRouteCalculatorService,
  RouteMetrics,
  RoutePoint,
} from "../../domain/services/IRouteCalculatorService.js";
import { orderByNearestNeighbor } from "../../domain/services/orderByNearestNeighbor.js";
import { left, right, type Either } from "../../domain/shared/Either.js";
import { VanNotFoundError } from "../../domain/shared/errors/VanNotFoundError.js";
import { NotVanOwnerError } from "../shared/NotVanOwnerError.js";
import type { UseCase } from "../useCase.js";
import { NoConfirmedStudentsError } from "./errors/NoConfirmedStudentError.js";

export type GenerateRouteComparisonUseCaseInputDto = {
  vanId: string;
  requesterId: string;
  date: string;
  driverLocation: { lat: number; long: number };
  visitedStudentIds?: string[]; // alunos já atendidos (usado no recálculo)
  persist?: boolean; // false no recálculo, para não gravar rotas repetidas
};

export type RouteStopDto = {
  studentId: string;
  name: string;
  lat: number;
  long: number;
};

export type RouteResultDto = {
  studentOrder: string[];
  stops: RouteStopDto[];
  distanceKm: number;
  durationMin: number;
  geometry: { lat: number; long: number }[];
  approximate: boolean;
};

export type GenerateRouteComparisonUseCaseOutputDto = {
  simpleRoute: RouteResultDto;
  optimizedRoute: RouteResultDto;
};

// Percurso calculado: a ordem dos alunos decidida pelo caso de uso e as medidas do serviço.
type CalculatedRoute = RouteMetrics & { order: string[] };

export type GenerateRouteComparisonError =
  | VanNotFoundError
  | NoConfirmedStudentsError
  | NotVanOwnerError;

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
    private readonly userRepository: IUserRepository,
  ) {}

  public static create(
    vanRepository: IVanRepository,
    studentRepository: IStudentRepository,
    attendanceRepository: IAttendanceRepository,
    routeRepository: IRouteRepository,
    routeCalculator: IRouteCalculatorService,
    userRepository: IUserRepository,
  ) {
    return new GenerateRouteComparisonUseCase(
      vanRepository,
      studentRepository,
      attendanceRepository,
      routeRepository,
      routeCalculator,
      userRepository,
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
    if (van.driverId !== input.requesterId) {
      return left(new NotVanOwnerError(input.vanId));
    }
    const visited = new Set(input.visitedStudentIds ?? []);
    const confirmedStudents = (
      await this.getConfirmedStudents(input.vanId, input.date)
    ).filter((student) => !visited.has(student.id));

    if (confirmedStudents.length === 0) {
      return left(new NoConfirmedStudentsError(input.vanId, input.date));
    }

    const confirmedPoints: RoutePoint[] = confirmedStudents.map((student) => ({
      studentId: student.id,
      lat: student.coordinates.value.lat,
      long: student.coordinates.value.long,
    }));

    const parsedDate = new Date(input.date);

    // Rota simples: visita os alunos na ordem de cadastro.
    const simpleResult = await this.buildRoute(
      input.driverLocation,
      confirmedPoints,
    );

    // Rota otimizada: a ordem vem da heurística do vizinho mais próximo,
    // aplicada sobre as distâncias fornecidas pelo serviço.
    const distances = await this.routeCalculator.getDistanceMatrix(
      input.driverLocation,
      confirmedPoints,
    );
    const optimizedPoints = orderByNearestNeighbor(distances).flatMap(
      (index) => {
        const point = confirmedPoints[index - 1];
        return point ? [point] : [];
      },
    );
    const optimizedResult = await this.buildRoute(
      input.driverLocation,
      optimizedPoints,
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

    if (input.persist !== false) {
      if (simpleRouteOrError.isRight()) {
        await this.routeRepository.create(simpleRouteOrError.value);
      }
      if (optimizedRouteOrError.isRight()) {
        await this.routeRepository.create(optimizedRouteOrError.value);
      }
    }

    const stopsById = await this.buildStopsById(confirmedStudents);

    return right(this.presentOutput(simpleResult, optimizedResult, stopsById));
  }

  private async buildRoute(
    origin: GeoPoint,
    orderedPoints: RoutePoint[],
  ): Promise<CalculatedRoute> {
    const metrics = await this.routeCalculator.calculateRoute(
      origin,
      orderedPoints,
    );
    return { order: orderedPoints.map((point) => point.studentId), ...metrics };
  }

  private async getConfirmedStudents(
    vanId: string,
    date: string,
  ): Promise<Student[]> {
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

    return allStudents.filter((student) => !absentStudentsIds.has(student.id));
  }

  private async buildStopsById(
    students: Student[],
  ): Promise<Map<string, RouteStopDto>> {
    const entries = await Promise.all(
      students.map(async (student): Promise<[string, RouteStopDto]> => {
        const user = await this.userRepository.findById(student.userId);
        return [
          student.id,
          {
            studentId: student.id,
            name: user?.name.value ?? "Aluno sem cadastro",
            lat: student.coordinates.value.lat,
            long: student.coordinates.value.long,
          },
        ];
      }),
    );
    return new Map(entries);
  }

  private presentOutput(
    simpleResult: CalculatedRoute,
    optimizedResult: CalculatedRoute,
    stopsById: Map<string, RouteStopDto>,
  ): GenerateRouteComparisonUseCaseOutputDto {
    const toDto = (result: CalculatedRoute): RouteResultDto => ({
      studentOrder: result.order,
      stops: result.order.flatMap((id) => {
        const stop = stopsById.get(id);
        return stop ? [stop] : [];
      }),
      distanceKm: result.distanceKm,
      durationMin: result.durationMin,
      geometry: result.geometry,
      approximate: result.approximate,
    });

    return {
      simpleRoute: toDto(simpleResult),
      optimizedRoute: toDto(optimizedResult),
    };
  }
}
