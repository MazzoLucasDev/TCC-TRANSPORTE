import type { Request, Response } from "express";
import type { ListConfirmedAttendanceUseCase } from "../../../useCases/attendance/ListConfirmedAttendanceUseCase.js";
import type { LinkStudentToVanUseCase } from "../../../useCases/student/LinkStudentToVanUseCase.js";
import type { ListVanStudentUseCase } from "../../../useCases/student/ListVanStudentUseCase.js";
import type { RegisterAbsenceUseCase } from "../../../useCases/student/RegisterAbsenceUseCase.js";
import { error } from "node:console";
import type { UnlinkStudentToVanUseCase } from "../../../useCases/student/UnlinkStudentToVanUseCase.js";

export class StudentController {
  constructor(
    private readonly linkStudentToVanUseCase: LinkStudentToVanUseCase,
    private readonly unlinkStudentToVanUseCase: UnlinkStudentToVanUseCase,
    private readonly listVanStudentUseCase: ListVanStudentUseCase,
    private readonly registerAbsenceUseCase: RegisterAbsenceUseCase,
    private readonly listConfirmedAttendanceUseCase: ListConfirmedAttendanceUseCase,
  ) {}

  async link(req: Request, res: Response): Promise<Response> {
    const result = await this.linkStudentToVanUseCase.execute(req.body);

    if (result.isLeft()) {
      return res.status(400).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async unlink(req: Request, res: Response): Promise<Response> {
    const result = await this.unlinkStudentToVanUseCase.execute(req.body);

    if (result.isLeft()) {
      return res.status(400).json({ error: result.value.message });
    }
    return res.status(200).json(result.value);
  }

  async listByVan(req: Request, res: Response): Promise<Response> {
    const vanId = req.params.vanId;
    if (typeof vanId !== "string" || vanId.length === 0) {
      return res.status(400).json({ error: "VanId é obrigatório!!!" });
    }

    const result = await this.listVanStudentUseCase.execute({ vanId });
    return res.status(200).json(result);
  }

  async registerAbsence(req: Request, res: Response): Promise<Response> {
    const result = await this.registerAbsenceUseCase.execute(req.body);

    if (result.isLeft()) {
      return res.status(400).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async listConfirmed(req: Request, res: Response): Promise<Response> {
    const { vanId, date } = req.query;

    if (typeof vanId !== "string" || typeof date !== "string") {
      return res
        .status(400)
        .json({ error: "vanId e date são obrigatórios!!!" });
    }

    const result = await this.listConfirmedAttendanceUseCase.execute({
      vanId,
      date,
    });
    return res.status(200).json(result);
  }
}
