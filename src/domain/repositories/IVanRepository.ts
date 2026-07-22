import type { Van } from "../entities/van/Van.js";

export interface IVanRepository {
  create(van: Van): Promise<void>;
  update(van: Van): Promise<void>;
  listAll(): Promise<Van[]>;
  listDriverVans(driverId: string): Promise<Van[]>;
  findById(vanId: string): Promise<Van | null>;
  delete(id: string): Promise<void>;
}
