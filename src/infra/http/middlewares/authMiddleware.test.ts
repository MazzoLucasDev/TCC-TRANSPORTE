import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response, NextFunction } from "express";
import {
  createAuthMiddleware,
  requireDriver,
  requireSelf,
  type AuthenticatedRequest,
} from "./authMiddleware.js";
import type { ITokenService } from "../../../domain/services/ITokenService.js";

const buildRes = () => {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as Response;
};

describe("createAuthMiddleware", () => {
  let tokenService: ITokenService;
  let middleware: ReturnType<typeof createAuthMiddleware>;

  beforeEach(() => {
    tokenService = {
      generate: vi.fn(),
      verify: vi.fn().mockReturnValue({ userId: "user-1", userType: "ALUNO" }),
    };
    middleware = createAuthMiddleware(tokenService);
  });

  const buildReq = (authorization?: string) =>
    ({
      headers: authorization ? { authorization } : {},
    }) as unknown as AuthenticatedRequest;

  it("deve responder 401 quando não há cabeçalho Authorization", () => {
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    middleware(buildReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(tokenService.verify).not.toHaveBeenCalled();
  });

  it("deve responder 401 quando o cabeçalho não traz o token", () => {
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    middleware(buildReq("Bearer"), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("deve responder 401 quando o token é inválido ou expirado", () => {
    tokenService.verify = vi.fn().mockReturnValue(null);
    middleware = createAuthMiddleware(tokenService);
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    middleware(buildReq("Bearer token-invalido"), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("deve preencher userId e userType e chamar next quando o token é válido", () => {
    const req = buildReq("Bearer token-valido");
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);

    expect(tokenService.verify).toHaveBeenCalledWith("token-valido");
    expect(req.userId).toBe("user-1");
    expect(req.userType).toBe("ALUNO");
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("requireDriver", () => {
  it("deve permitir quando o usuário é MOTORISTA", () => {
    const req = { userType: "MOTORISTA" } as AuthenticatedRequest;
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    requireDriver(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("deve bloquear com 403 quando o usuário é ALUNO", () => {
    const req = { userType: "ALUNO" } as AuthenticatedRequest;
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    requireDriver(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("deve bloquear com 403 quando não há tipo de usuário", () => {
    const req = {} as AuthenticatedRequest;
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    requireDriver(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("requireSelf", () => {
  it("deve permitir quando userId do token bate com o da URL", () => {
    const req = {
      userId: "user-1",
      params: { userId: "user-1" },
    } as unknown as AuthenticatedRequest;
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    requireSelf(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("deve bloquear com 403 quando userId do token é diferente do da URL", () => {
    const req = {
      userId: "user-1",
      params: { userId: "outro-user" },
    } as unknown as AuthenticatedRequest;
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    requireSelf(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
