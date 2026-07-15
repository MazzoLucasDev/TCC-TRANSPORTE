import type { Driver } from "../entities/driver/Driver.js";

export interface IDriverRepository {
  findById(id: string): Promise<Driver | null>;
  findByUserId(userId: string): Promise<Driver | null>;
  create(driver: Driver): Promise<void>;
  update(driver: Driver): Promise<void>;
  listAll(): Promise<Driver[]>;
  delete(id: string): Promise<void>;
}
