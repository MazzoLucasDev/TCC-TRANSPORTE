import type { Request, Response } from "express";
import type { CreateVanUseCase } from "../../../useCases/van/CreateVanUseCase.js";
import type { ListDriverVansUseCase } from "../../../useCases/van/ListDriverVansUseCase.js";
import { error } from "node:console";

export class VanController {
  constructor(
    private readonly createVanUseCase: CreateVanUseCase,
    private readonly listDriverVansUseCase: ListDriverVansUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<Response> {
    const result = await this.createVanUseCase.execute(req.body);

    if (result.isLeft()) {
      return res.status(400).json({ error: result.value.message });
    }

    return res.status(201).json(result.value);
  }

  async listByDriver(req: Request, res: Response): Promise<Response> {
    const driverId = req.params.driverId;
    if (typeof driverId !== "string" || driverId.length === 0) {
      return res.status(400).json({ error: "driverId é obrigatório!!!" });
    }

    const result = await this.listDriverVansUseCase.execute({ driverId });

    return res.status(200).json(result);
  }
}
