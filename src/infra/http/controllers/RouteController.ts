import type { Request, Response } from "express";
import type { GenerateRouteComparisonUseCase } from "../../../useCases/route/GenerateRouteComparisonUseCase.js";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.js";

export class RouteController {
  constructor(
    private readonly generateRouteComparisonUseCase: GenerateRouteComparisonUseCase,
  ) {}

  async generate(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const result = await this.generateRouteComparisonUseCase.execute(req.body);

    if (result.isLeft()) {
      return res.status(400).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }
}
