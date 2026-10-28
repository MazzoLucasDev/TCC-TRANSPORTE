import type { Request, Response } from "express";
import type { GenerateRouteComparisonUseCase } from "../../../useCases/route/GenerateRouteComparisonUseCase.js";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { NotVanOwnerError } from "../../../useCases/shared/NotVanOwnerError.js";

export class RouteController {
  constructor(
    private readonly generateRouteComparisonUseCase: GenerateRouteComparisonUseCase,
  ) {}

  async generate(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const result = await this.generateRouteComparisonUseCase.execute({
      ...req.body,
      requesterId: req.userId!,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotVanOwnerError ? 403 : 400;
      return res.status(status).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }
}
