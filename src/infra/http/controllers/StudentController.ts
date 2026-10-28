import type { Request, Response } from "express";
import type { ListConfirmedAttendanceUseCase } from "../../../useCases/attendance/ListConfirmedAttendanceUseCase.js";
import type { LinkStudentToVanUseCase } from "../../../useCases/student/LinkStudentToVanUseCase.js";
import type { ListVanStudentUseCase } from "../../../useCases/student/ListVanStudentUseCase.js";
import type { RegisterAbsenceUseCase } from "../../../useCases/student/RegisterAbsenceUseCase.js";
import { error } from "node:console";
import type { UnlinkStudentToVanUseCase } from "../../../useCases/student/UnlinkStudentToVanUseCase.js";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { NotVanOwnerError } from "../../../useCases/shared/NotVanOwnerError.js";
import type { UpdateStudentUseCase } from "../../../useCases/student/UpdateStudentUseCase.js";
import type { DeleteStudentUseCase } from "../../../useCases/student/DeleteStudentUseCase.js";
import { NotStudentOwnerError } from "../../../useCases/shared/NotStudentOwnerError.js";
import type { GetStudentSummaryUseCase } from "../../../useCases/student/GetStudentSummaryUseCase.js";
import { NotVanMemberError } from "../../../useCases/shared/NotVanMemberError.js";
import type { GetMyStudentProfileUseCase } from "../../../useCases/student/GetMyStudentProfileUseCase.js";
import type { RegisterPresenceUseCase } from "../../../useCases/student/RegisterPresenceUseCase.js";

export class StudentController {
  constructor(
    private readonly linkStudentToVanUseCase: LinkStudentToVanUseCase,
    private readonly unlinkStudentToVanUseCase: UnlinkStudentToVanUseCase,
    private readonly updateStudentUseCase: UpdateStudentUseCase,
    private readonly deleteStudentUseCase: DeleteStudentUseCase,
    private readonly listVanStudentUseCase: ListVanStudentUseCase,
    private readonly registerAbsenceUseCase: RegisterAbsenceUseCase,
    private readonly listConfirmedAttendanceUseCase: ListConfirmedAttendanceUseCase,
    private readonly getStudentSummaryUseCase: GetStudentSummaryUseCase,
    private readonly getMyStudentProfileUseCase: GetMyStudentProfileUseCase,
    private readonly registerPresenceUseCase: RegisterPresenceUseCase,
  ) {}

  async link(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const result = await this.linkStudentToVanUseCase.execute({
      ...req.body,
      requesterId: req.userId!,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotVanOwnerError ? 403 : 400;
      return res.status(status).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async unlink(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const result = await this.unlinkStudentToVanUseCase.execute({
      ...req.body,
      requesterId: req.userId!,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotVanOwnerError ? 403 : 400;
      return res.status(status).json({ error: result.value.message });
    }
    return res.status(200).json(result.value);
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const studentId = req.params.studentId;
    if (typeof studentId !== "string") {
      return res.status(400).json({ error: "studentId é obrigatório" });
    }

    const result = await this.updateStudentUseCase.execute({
      ...req.body,
      studentId,
      requesterId: req.userId!,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotStudentOwnerError ? 403 : 400;
      return res.status(status).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const studentId = req.params.studentId;
    if (typeof studentId !== "string") {
      return res.status(400).json({ error: "studentId é obrigatório" });
    }

    const result = await this.deleteStudentUseCase.execute({
      studentId,
      requesterId: req.userId!,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotStudentOwnerError ? 403 : 400;
      return res.status(status).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async listByVan(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const vanId = req.params.vanId;
    if (typeof vanId !== "string" || vanId.length === 0) {
      return res.status(400).json({ error: "VanId é obrigatório!!!" });
    }

    const result = await this.listVanStudentUseCase.execute({
      requesterId: req.userId!,
      vanId,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotVanMemberError ? 403 : 404;
      return res.status(status).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async registerAbsence(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response> {
    const result = await this.registerAbsenceUseCase.execute({
      ...req.body,
      requesterId: req.userId!,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotStudentOwnerError ? 403 : 400;
      return res.status(status).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async listConfirmed(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response> {
    const { vanId, date } = req.query;

    if (typeof vanId !== "string" || typeof date !== "string") {
      return res
        .status(400)
        .json({ error: "vanId e date são obrigatórios!!!" });
    }

    const result = await this.listConfirmedAttendanceUseCase.execute({
      requesterId: req.userId!,
      vanId,
      date,
    });
    if (result.isLeft()) {
      const status = result.value instanceof NotVanOwnerError ? 403 : 400;
      return res.status(status).json({ error: result.value.message });
    }
    return res.status(200).json(result.value);
  }
  async getSummary(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response> {
    const studentId = req.params.studentId;
    if (typeof studentId !== "string" || studentId.length === 0) {
      return res.status(400).json({ error: "studentId é obrigatório" });
    }

    const result = await this.getStudentSummaryUseCase.execute({ studentId });

    if (result.isLeft()) {
      return res.status(404).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }
  async getMe(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const date = req.query.date;
    if (typeof date !== "string") {
      return res.status(400).json({ error: "date é obrigatório!" });
    }

    const result = await this.getMyStudentProfileUseCase.execute({
      requesterId: req.userId!,
      date,
    });

    if (result.isLeft()) {
      return res.status(400).json({ error: result.value.message });
    }
    return res.status(200).json(result.value);
  }

  async registerPresence(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response> {
    const result = await this.registerPresenceUseCase.execute({
      ...req.body,
      requesterId: req.userId!,
    });

    if (result.isLeft()) {
      const status = result.value instanceof NotStudentOwnerError ? 403 : 400;
      return res.status(status).json({ error: result.value.message });
    }
    return res.status(200).json(result.value);
  }
}
