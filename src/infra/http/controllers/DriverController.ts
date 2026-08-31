import type { Response } from "express";
import type { DeleteDriverUseCase } from "../../../useCases/driver/DeleteDriverUseCase.js";
import type { UpdateDriverUseCase } from "../../../useCases/driver/UpdateDriverUseCase.js";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { NotDriverOwnerError } from "../../../useCases/shared/NotDriverOwnerError.js";

export class DriverController {
  constructor(
    private readonly updateDriverUseCase: UpdateDriverUseCase,
    private readonly deleteDriverUseCase: DeleteDriverUseCase,
  ) {}

  async update(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const driverId = req.params.driverId;

    if (typeof driverId !== "string") {
      return res.status(400).json({ error: "driverId é obrigatório" });
    }

    const result = await this.updateDriverUseCase.execute({
      driverId,
      requesterId: req.userId!,
      ...req.body,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotDriverOwnerError ? 403 : 400;
      return res.status(status).json({ result: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const driverId = req.params.driverId;
    if (typeof driverId !== "string") {
      return res.status(400).json({ error: "driverId é obrigatório" });
    }

    const result = await this.deleteDriverUseCase.execute({
      driverId,
      requesterId: req.userId!,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotDriverOwnerError ? 403 : 400;
      return res.status(status).json({ result: result.value.message });
    }

    return res.status(200).json(result.value);
  }
}
