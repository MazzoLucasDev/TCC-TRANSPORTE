// authMiddleware.test.ts
import { describe, it, expect, vi } from "vitest";
import { requireSelf, type AuthenticatedRequest } from "./authMiddleware";
import type { Response, NextFunction } from "express";

describe("requireSelf", () => {
  const buildRes = () => {
    const res: Partial<Response> = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    return res as Response;
  };

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
