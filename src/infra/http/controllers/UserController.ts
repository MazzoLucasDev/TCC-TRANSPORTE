import { error } from "node:console";
import type { CreateUserUseCase } from "../../../useCases/user/CreateUserUseCase.js";
import type { LoginUseCase } from "../../../useCases/user/LoginUseCase.js";
import type { Request, Response } from "express";
import type { UpdateUserUseCase } from "../../../useCases/user/UpdateUserUseCase.js";
import type { DeleteUserUseCase } from "../../../useCases/user/DeleteUserCase.js";

export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<Response> {
    const result = await this.createUserUseCase.execute(req.body);

    if (result.isLeft()) {
      return res.status(400).json({ error: result.value.message });
    }

    return res.status(201).json(result.value);
  }
  async update(req: Request, res: Response): Promise<Response> {
    const userId = req.params.userId;
    if (typeof userId !== "string") {
      return res.status(400).json({ error: "UserId é obrigatório" });
    }
    const result = await this.updateUserUseCase.execute({
      userId,
      ...req.body,
    });

    if (result.isLeft()) {
      return res.status(400).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const userId = req.params.userId;
    if (typeof userId !== "string") {
      return res.status(400).json({ error: "UserId é obrigatório" });
    }
    const result = await this.deleteUserUseCase.execute({ id: userId });

    if (result.isLeft()) {
      return res.status(400).json({ error: result.value.message });
    }

    return res.status(200).json(result.value);
  }

  async login(req: Request, res: Response): Promise<Response> {
    const result = await this.loginUseCase.execute(req.body);

    if (result.isLeft()) {
      return res.status(401).json({ error: result.value.message });
    }
    return res.status(200).json(result.value);
  }
}
