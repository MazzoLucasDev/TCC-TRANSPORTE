import jwt from "jsonwebtoken";
import type { ITokenService } from "../../domain/services/ITokenService.js";

const JWT_EXPIRES_IN = "8h";
export class JwtTokenService implements ITokenService {
  constructor(private readonly secret: string) {}

  generate(payload: { userId: string; userType: string }): string {
    return jwt.sign(payload, this.secret, { expiresIn: JWT_EXPIRES_IN });
  }

  verify(token: string): { userId: string; userType: string } | null {
    try {
      const decoded = jwt.verify(token, this.secret);
      if (typeof decoded === "string") {
        return null;
      }
      return {
        userId: decoded.userId,
        userType: decoded.userType,
      };
    } catch {
      return null;
    }
  }
}
