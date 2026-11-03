import type { Response } from "express";
import type { EndVanTripUseCase } from "../../../useCases/van/EndVanTripUseCase.js";
import type { GetVanLocationUseCase } from "../../../useCases/van/GetVanLocationUseCase.js";
import type { StartVanTripUseCase } from "../../../useCases/van/StartVanTripUseCase.js";
import type { UpdateVanLocationUseCase } from "../../../useCases/van/UpdateVanLocationUseCase.js";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { NotVanMemberError } from "../../../useCases/shared/NotVanMemberError.js";
import { NotVanOwnerError } from "../../../useCases/shared/NotVanOwnerError.js";

export class VanTripController {
  constructor(
    private readonly startVanTripUseCase: StartVanTripUseCase,
    private readonly endVanTripUseCase: EndVanTripUseCase,
    private readonly updateVanLocationUseCase: UpdateVanLocationUseCase,
    private readonly getVanLocationUseCase: GetVanLocationUseCase,
  ) {}

  async start(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const vanId = req.params.vanId;
    if (typeof vanId !== "string") {
      return res.status(400).json({ error: "VanId é obrigatório!" });
    }

    const result = await this.startVanTripUseCase.execute({
      vanId,
      requesterId: req.userId!,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotVanOwnerError ? 403 : 400;
      return res.status(status).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async end(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const vanId = req.params.vanId;
    if (typeof vanId !== "string") {
      return res.status(400).json({ error: "VanId é obrigatório!" });
    }

    const result = await this.endVanTripUseCase.execute({
      vanId,
      requesterId: req.userId!,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotVanOwnerError ? 403 : 400;
      return res.status(status).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async updateLocation(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response> {
    const vanId = req.params.vanId;
    if (typeof vanId !== "string") {
      return res.status(400).json({ error: "VanId é obrigatório!" });
    }

    const result = await this.updateVanLocationUseCase.execute({
      ...req.body,
      vanId,
      requesterId: req.userId!,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotVanOwnerError ? 403 : 400;
      return res.status(status).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async getLocation(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response> {
    const vanId = req.params.vanId;
    if (typeof vanId !== "string") {
      return res.status(400).json({ error: "VanId é obrigatório!" });
    }

    const result = await this.getVanLocationUseCase.execute({
      vanId,
      requesterId: req.userId!,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotVanMemberError ? 403 : 400;
      return res.status(status).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }
}
