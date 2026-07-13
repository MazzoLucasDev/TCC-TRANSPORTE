import type { CollectionPoint } from "./valueObjects/CollectionPoint.js";

export type StudentProps = {
  readonly id: string;
  readonly userId: string;
  vanId: string | null;
  pontoColeta: CollectionPoint | null;
};
