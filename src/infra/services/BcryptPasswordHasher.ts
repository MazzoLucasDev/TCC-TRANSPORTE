import type { IPasswordHasher } from "../../domain/services/IPasswordHasher.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, SALT_ROUNDS);
  }

  async compare(plainText: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }
}
