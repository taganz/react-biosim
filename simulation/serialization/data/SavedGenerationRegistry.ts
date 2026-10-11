export type SavedSingleGeneration = {
  /** Generation */
  g: number;
  /** Survivor Count */
  sC: number;
  /** Initial population */
  sP: number;
  /** Max Fitness value */
  fV: number;
  /** Births (missing in older files) */
  b?: number;
  /** Deaths (missing in older files) */
  d?: number;
};

export default interface SavedGenerationRegistry {
  generations: SavedSingleGeneration[];
  minSurvivorCount: number;
  maxSurvivorCount: number;
  maxFitnessValue: number;
}
