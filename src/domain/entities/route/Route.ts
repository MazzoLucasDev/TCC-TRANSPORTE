import { left, Right, right, type Either } from "../../shared/Either.js";
import { InvalidRouteError } from "./errors/InvalidRouteError.js";

export type RouteType = "SIMPLE" | "OPTIMIZED";

export type RouteProps = {
  readonly id: string;
  readonly vanId: string;
  readonly date: Date;
  readonly type: RouteType;
  readonly studentOrder: string[];
  readonly distanceKm: number;
  readonly durationMin: number;
};

export class Route {
  private constructor(private readonly props: RouteProps) {
    Object.freeze(this);
  }

  public static create(props: {
    vanId: string;
    date: Date;
    type: RouteType;
    studentOrder: string[];
    distanceKm: number;
    durationMin: number;
  }): Either<InvalidRouteError, Route> {
    if (!props.vanId || props.vanId.trim().length === 0) {
      return left(new InvalidRouteError("Van ID não informado!"));
    }

    if (props.studentOrder.length === 0) {
      return left(new InvalidRouteError("Lista de alunos não pode ser 0."));
    }

    if (props.distanceKm < 0) {
      return left(new InvalidRouteError("Distância não pode ser negativa!"));
    }

    if (props.durationMin < 0) {
      return left(new InvalidRouteError("Duração não pode ser negativa!"));
    }
    return right(
      new Route({
        id: crypto.randomUUID(),
        vanId: props.vanId,
        date: props.date,
        type: props.type,
        studentOrder: props.studentOrder,
        distanceKm: props.distanceKm,
        durationMin: props.durationMin,
      }),
    );
  }
  get id(): string {
    return this.props.id;
  }

  get vanId(): string {
    return this.props.vanId;
  }

  get date(): Date {
    return this.props.date;
  }

  get type(): RouteType {
    return this.props.type;
  }

  get studentOrder(): string[] {
    return this.props.studentOrder;
  }

  get distanceKm(): number {
    return this.props.distanceKm;
  }
  get durationMin(): number {
    return this.props.durationMin;
  }
  isOptimized(): boolean {
    return this.props.type === "OPTIMIZED";
  }

  toPersistence(): {
    id: string;
    vanId: string;
    date: Date;
    type: string;
    studentOrder: string[];
    distanceKm: number;
    durationMin: number;
  } {
    return {
      id: this.props.id,
      vanId: this.props.vanId,
      date: this.props.date,
      type: this.props.type,
      studentOrder: this.props.studentOrder,
      distanceKm: this.props.distanceKm,
      durationMin: this.props.durationMin,
    };
  }
  static reconstitute(props: {
    id: string;
    vanId: string;
    date: Date;
    type: string;
    studentOrder: string[];
    distanceKm: number;
    durationMin: number;
  }): Route {
    return new Route({
      id: props.id,
      vanId: props.vanId,
      date: props.date,
      type: props.type as RouteType,
      studentOrder: props.studentOrder,
      distanceKm: props.distanceKm,
      durationMin: props.durationMin,
    });
  }
}
