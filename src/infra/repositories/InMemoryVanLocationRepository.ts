import type { VanLocation } from "../../domain/entities/van/VanLocation.js";
import type { IVanLocationRepository } from "../../domain/repositories/IVanLocationRepository.js";

/**
 * A posição é um dado efêmero (só a última importa), então vive em memória.
 * Para várias instâncias do servidor, bastaria outra implementação da mesma
 * interface (Redis, por exemplo), sem mexer nos casos de uso.
 */
export class InMemoryVanLocationRepository implements IVanLocationRepository {
  private readonly locations = new Map<string, VanLocation>();

  async save(location: VanLocation): Promise<void> {
    this.locations.set(location.vanId, location);
  }

  async findByVanId(vanId: string): Promise<VanLocation | null> {
    return this.locations.get(vanId) ?? null;
  }

  async delete(vanId: string): Promise<void> {
    this.locations.delete(vanId);
  }
}
