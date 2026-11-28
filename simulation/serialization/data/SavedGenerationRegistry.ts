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

/** plants, animals and water at a step of a run with metabolism */
export type SavedPopulationSample = {
  /** Step since the run started */
  s: number;
  /** Plants */
  p: number;
  /** Animals */
  a: number;
  /** Water in the cloud, in the cells, in the plants and in the animals (missing in older files) */
  wc?: number;
  we?: number;
  wp?: number;
  wa?: number;
  /** Continuous runs: water rained since the previous sample, and steps without rain (missing in older files) */
  r?: number;
  nr?: number;
};

/** a rain of a generational run with metabolism */
export type SavedRainEvent = {
  /** Step since the run started */
  s: number;
  /** Water added to the cells */
  w: number;
  /** 1 when the cloud had too little water and it did not rain */
  k?: 1;
};

export default interface SavedGenerationRegistry {
  generations: SavedSingleGeneration[];
  /** missing in older files */
  populationSamples?: SavedPopulationSample[];
  /** missing in older files */
  rainEvents?: SavedRainEvent[];
  minSurvivorCount: number;
  maxSurvivorCount: number;
  maxFitnessValue: number;
}
