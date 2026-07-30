import { User } from "../entities/user/User.js";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<void>;
  update(user: User): Promise<void>;
  listAll(): Promise<User[]>;
  delete(id: string): Promise<void>;
}
