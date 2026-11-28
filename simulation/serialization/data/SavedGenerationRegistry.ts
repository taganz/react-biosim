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

/** plants and animals at a step of a continuous run with metabolism */
export type SavedPopulationSample = {
  /** Step since the run started */
  s: number;
  /** Plants */
  p: number;
  /** Animals */
  a: number;
};

export default interface SavedGenerationRegistry {
  generations: SavedSingleGeneration[];
  /** missing in older files */
  populationSamples?: SavedPopulationSample[];
  minSurvivorCount: number;
  maxSurvivorCount: number;
  maxFitnessValue: number;
}
