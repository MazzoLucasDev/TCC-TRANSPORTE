import { error } from "node:console";
import type { CreateUserUseCase } from "../../../useCases/user/CreateUserUseCase.js";
import type { LoginUseCase } from "../../../useCases/user/LoginUseCase.js";
import type { Request, Response } from "express";

export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<Response> {
    const result = await this.createUserUseCase.execute(req.body);

    if (result.isLeft()) {
      return res.status(400).json({ error: result.value.message });
    }

    return res.status(201).json(result.value);
  }

  async login(req: Request, res: Response): Promise<Response> {
    const result = await this.loginUseCase.execute(req.body);

    if (result.isLeft()) {
      return res.status(401).json({ error: result.value.message });
    }
    return res.status(200).json(result.value);
  }
}
