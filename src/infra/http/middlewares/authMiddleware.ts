import type { NextFunction, Request, Response } from "express";
import type { ITokenService } from "../../../domain/services/ITokenService.js";

export type AuthenticatedRequest = Request & {
  userId?: string;
  userType?: string;
};

export function createAuthMiddleware(tokenService: ITokenService) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Response | void => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido!" });
    }

    const [, token] = authHeader.split(" ");
    if (!token) {
      return res.status(401).json({ error: "Token mal formatado!" });
    }

    const decoded = tokenService.verify(token);
    if (!decoded) {
      return res.status(401).json({ error: "Token inválido ou expirado!" });
    }

    req.userId = decoded.userId;
    req.userType = decoded.userType;
    next();
  };
}

export function requireDriver(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Response | void {
  if (req.userType !== "MOTORISTA") {
    return res.status(403).json({ error: "Acesso restrito a motoristas!" });
  }
  next();
}

export function requireSelf(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Response | void {
  const targetUserId = req.params.userId;

  if (req.userId !== targetUserId) {
    return res
      .status(403)
      .json({ error: "Você só pode alterar seus próprios dados" });
  }

  next();
}
