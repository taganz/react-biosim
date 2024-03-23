export type SavedSingleGeneration = {
  /** Generation */
  g: number;
  /** Survivor Count */
  sC: number;
  /** Initial population */
  sP: number;
  /** Max Fitness value */
  fV: number;
};

export default interface SavedGenerationRegistry {
  generations: SavedSingleGeneration[];
  minSurvivorCount: number;
  maxSurvivorCount: number;
  maxFitnessValue: number;
}
