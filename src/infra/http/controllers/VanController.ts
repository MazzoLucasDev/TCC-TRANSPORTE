import type { Request, Response } from "express";
import type { CreateVanUseCase } from "../../../useCases/van/CreateVanUseCase.js";
import type { ListDriverVansUseCase } from "../../../useCases/van/ListDriverVansUseCase.js";
import { error } from "node:console";
import type { UpdateVanUseCase } from "../../../useCases/van/UpdateVanUseCase.js";
import type { DeleteVanUseCase } from "../../../useCases/van/DeleteVanUseCase.js";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { NotVanOwnerError } from "../../../useCases/shared/NotVanOwnerError.js";

export class VanController {
  constructor(
    private readonly createVanUseCase: CreateVanUseCase,
    private readonly updateVanUseCase: UpdateVanUseCase,
    private readonly deleteVanUseCase: DeleteVanUseCase,
    private readonly listDriverVansUseCase: ListDriverVansUseCase,
  ) {}

  async create(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const result = await this.createVanUseCase.execute(req.body);

    if (result.isLeft()) {
      return res.status(400).json({ error: result.value.message });
    }

    return res.status(201).json(result.value);
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const vanId = req.params.vanId;
    if (typeof vanId !== "string") {
      return res.status(400).json({ error: "VanId é obrigatório!" });
    }
    const result = await this.updateVanUseCase.execute({
      vanId,
      requesterId: req.userId!,
      ...req.body,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotVanOwnerError ? 403 : 400;
      return res.status(status).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const vanId = req.params.vanId;
    if (typeof vanId !== "string") {
      return res.status(400).json({ error: "VanId é obrigatório!" });
    }

    const result = await this.deleteVanUseCase.execute({
      id: vanId,
      requesterId: req.userId!,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotVanOwnerError ? 403 : 400;
      return res.status(status).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async listByDriver(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response> {
    const driverId = req.params.driverId;
    if (typeof driverId !== "string" || driverId.length === 0) {
      return res.status(400).json({ error: "driverId é obrigatório!!!" });
    }

    const result = await this.listDriverVansUseCase.execute({ driverId });

    return res.status(200).json(result);
  }
}
