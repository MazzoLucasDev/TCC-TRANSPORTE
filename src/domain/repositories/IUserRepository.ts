import { User } from "../entities/user/User.js";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  existsByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  updateById(user: User): Promise<void>;
  listAll(): Promise<User[]>;
  delete(id: string): Promise<void>;
}
