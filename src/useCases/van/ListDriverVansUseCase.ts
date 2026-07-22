import type { Van } from "../../domain/entities/van/Van.js";
import type { IVanRepository } from "../../domain/repositories/IVanRepository.js";
import type { UseCase } from "../useCase.js";

export type ListDriverVansInputDto = {
  driverId: string;
};

export type ListDriverVansOuputDto = {
  vansProps: Array<{
    id: string;
    model: string;
    year: number;
    period: string;
    destiny: string;
    capacity: number;
    emTrajeto: boolean;
  }>;
};
export class ListDriverVansUseCase implements UseCase<
  ListDriverVansInputDto,
  ListDriverVansOuputDto
> {
  private constructor(private readonly vanRepository: IVanRepository) {}
  public static create(vanRepository: IVanRepository) {
    return new ListDriverVansUseCase(vanRepository);
  }

  public async execute(
    input: ListDriverVansInputDto,
  ): Promise<ListDriverVansOuputDto> {
    const vans = await this.vanRepository.listDriverVans(input.driverId);
    return this.presentOutput(vans);
  }

  private presentOutput(vans: Van[]): ListDriverVansOuputDto {
    return {
      vansProps: vans.map((van) => ({
        id: van.id,
        model: van.model.value,
        year: van.year.value,
        period: van.period.value,
        destiny: van.destiny.value,
        capacity: van.capacity.value,
        emTrajeto: van.emTrajeto,
      })),
    };
  }
}
