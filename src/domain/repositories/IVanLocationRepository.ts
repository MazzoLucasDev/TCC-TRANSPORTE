import type { VanLocation } from "../entities/van/VanLocation.js";

export interface IVanLocationRepository {
  save(location: VanLocation): Promise<void>; // guarda só a última posição da van
  findByVanId(vanId: string): Promise<VanLocation | null>;
  delete(vanId: string): Promise<void>;
}
