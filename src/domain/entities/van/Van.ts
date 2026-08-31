import { left, right, type Either } from "../../shared/Either.js";
import type { InvalidCapacityError } from "./errors/InvalidCapacityError.js";
import type { InvalidDestinyError } from "./errors/InvalidDestinyError.js";
import type { InvalidModelError } from "./errors/InvalidModelError.js";
import type { InvalidPeriodError } from "./errors/InvalidPeriodError.js";
import type { InvalidYearError } from "./errors/InvalidYearError.js";
import { InvalidDriverIdError } from "./errors/InvalidDriverIdError.js";
import { Capacity } from "./valueObjects/Capacity.js";
import { Destiny } from "./valueObjects/Destiny.js";
import { Model } from "./valueObjects/Model.js";
import { Period } from "./valueObjects/Period.js";
import { Year } from "./valueObjects/Year.js";
import type { VanData } from "./VanData.js";

export type VanProps = {
  readonly id: string;
  model: Model;
  year: Year;
  period: Period;
  destiny: Destiny;
  capacity: Capacity;
  driverId: string;
  emTrajeto: boolean;
};

export type VanError =
  | InvalidModelError
  | InvalidYearError
  | InvalidPeriodError
  | InvalidDestinyError
  | InvalidCapacityError
  | InvalidDriverIdError;

export class Van {
  private constructor(private readonly props: VanProps) {
    Object.freeze(this);
  }
  public static create(vanData: VanData): Either<VanError, Van> {
    const modelOrError = Model.create(vanData.model);
    const yearOrError = Year.create(vanData.year);
    const periodOrError = Period.create(vanData.period);
    const destinyOrError = Destiny.create(vanData.destiny);
    const capacityOrError = Capacity.create(vanData.capacity);

    if (modelOrError.isLeft()) return left(modelOrError.value);
    if (yearOrError.isLeft()) return left(yearOrError.value);
    if (periodOrError.isLeft()) return left(periodOrError.value);
    if (destinyOrError.isLeft()) return left(destinyOrError.value);
    if (capacityOrError.isLeft()) return left(capacityOrError.value);

    if (!vanData.driverId || vanData.driverId.trim().length === 0) {
      return left(new InvalidDriverIdError(vanData.driverId));
    }

    return right(
      new Van({
        id: crypto.randomUUID(),
        model: modelOrError.value,
        year: yearOrError.value,
        period: periodOrError.value,
        destiny: destinyOrError.value,
        capacity: capacityOrError.value,
        driverId: vanData.driverId,
        emTrajeto: false,
      }),
    );
  }
  get id(): string {
    return this.props.id;
  }

  get model(): Model {
    return this.props.model;
  }

  get year(): Year {
    return this.props.year;
  }

  get period(): Period {
    return this.props.period;
  }

  get destiny(): Destiny {
    return this.props.destiny;
  }

  get capacity(): Capacity {
    return this.props.capacity;
  }

  get driverId(): string {
    return this.props.driverId;
  }
  get emTrajeto(): boolean {
    return this.props.emTrajeto;
  }

  withUpdatedDetails(props: {
    model: Model;
    year: Year;
    period: Period;
    destiny: Destiny;
    capacity: Capacity;
  }): Van {
    return new Van({ ...this.props, ...props });
  }

  toPersistence(): {
    id: string;
    model: string;
    year: number;
    period: string;
    destiny: string;
    capacity: number;
    driverId: string;
    emTrajeto: boolean;
  } {
    return {
      id: this.props.id,
      model: this.props.model.value,
      year: this.props.year.value,
      period: this.props.period.value,
      destiny: this.props.destiny.value,
      capacity: this.props.capacity.value,
      driverId: this.props.driverId,
      emTrajeto: this.props.emTrajeto,
    };
  }

  static reconstitute(props: {
    id: string;
    model: string;
    year: number;
    period: string;
    destiny: string;
    capacity: number;
    driverId: string;
    emTrajeto: boolean;
  }): Van {
    return new Van({
      id: props.id,
      model: Model.restore(props.model),
      year: Year.restore(props.year),
      period: Period.restore(props.period),
      destiny: Destiny.restore(props.destiny),
      capacity: Capacity.restore(props.capacity),
      driverId: props.driverId,
      emTrajeto: props.emTrajeto,
    });
  }

  verificarCapacidade(quantidadeAtual: number): boolean {
    return quantidadeAtual < this.capacity.value;
  }

  alterarStatusTrajeto(emTrajeto: boolean): Van {
    return new Van({ ...this.props, emTrajeto });
  }
}
