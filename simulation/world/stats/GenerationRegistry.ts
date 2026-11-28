import WorldController from "../WorldController";

export type SingleGeneration = {
  generation: number;
  survivorCount: number;
  startingPopulation: number;
  maxFitnessValue : number;
  /** creatures born and dead during the generation (missing in older saved files) */
  births?: number;
  deaths?: number;
};

/**
 * Plants and animals alive at the end of a step, and where the water is, in runs with metabolism.
 * Animals are every creature that is not a plant. The water fields are missing in older saved files.
 */
export type PopulationSample = {
  /** steps since the run started: (generation - 1) * stepsPerGen + step */
  step: number;
  plants: number;
  animals: number;
  /** water in the cloud and in the cells */
  cloud?: number;
  cells?: number;
  /** water in the creatures (their mass): plants, and the rest */
  plantWater?: number;
  animalWater?: number;
  /** continuous runs, which rain every step: the water rained since the previous sample, and the steps
   *  in which it did not rain because the cloud had too little water */
  rain?: number;
  noRainSteps?: number;
};

/**
 * A rain of a generational run: the first rain of the run, and the ones between generations. Continuous
 * runs rain a little every step and have none. In runs with metabolism.
 */
export type RainEvent = {
  /** steps since the run started, as in PopulationSample: the first step of the generation */
  step: number;
  /** water that went from the cloud to the cells */
  water: number;
  /** the cloud had too little water for the rain, so it did not rain */
  skipped?: boolean;
};

/** steps between two population samples: a tenth of the shorter of maxAge and stepsPerGen, at least 1 */
export function populationSampleInterval(maxAge: number, stepsPerGen: number): number {
  return Math.max(1, Math.floor(Math.min(maxAge, stepsPerGen) / 10));
}

export class GenerationRegistry {
  generations: SingleGeneration[] = [];
  populationSamples: PopulationSample[] = [];
  rainEvents: RainEvent[] = [];
  // the rain of continuous runs since the last sample
  private stepRain = 0;
  private stepsWithoutRain = 0;
  minSurvivorCount: number = Number.MAX_VALUE;
  maxSurvivorCount: number = Number.MIN_VALUE;
  maxFitnessValue : number = 0;

  constructor(public worldController: WorldController) {}

  startGeneration() {
    // Register generation stats
    if (this.worldController.currentGen > 1) {
      const generation = this.worldController.currentGen - 1;
      const survivorCount = this.worldController.generations.lastSurvivorsCount;
      const startingPopulation = this.worldController.generations.lastCreatureCount;
      const maxFitnessValue = this.worldController.generations.lastFitnessMaxValue;
      const births = this.worldController.generations.lastBirths;
      const deaths = this.worldController.generations.lastDeaths;

      if (survivorCount > this.maxSurvivorCount) {
        this.maxSurvivorCount = survivorCount;
      }

      if (survivorCount < this.minSurvivorCount) {
        this.minSurvivorCount = survivorCount;
      }

      //console.log("gen registry: ", this.worldController.currentGen, ".", this.worldController.currentStep," ----", generation, survivorCount, startingPopulation, maxFitnessValue )      ;
      this.generations.push({ generation, survivorCount, startingPopulation, maxFitnessValue, births, deaths });
    }
  }

  // runs after every step; samples only runs with metabolism, every populationSampleInterval() steps
  endStep() {
    const worldController = this.worldController;
    const generations = worldController.generations;
    if (!generations.metabolismEnabled) return;
    const step = (worldController.currentGen - 1) * worldController.stepsPerGen + worldController.currentStep;
    if (step % populationSampleInterval(generations.maxAge, worldController.stepsPerGen) !== 0) return;
    let plants = 0;
    let plantWater = 0;
    let animalWater = 0;
    for (const creature of generations.currentCreatures) {
      if (creature.genus === "plant") {
        plants++;
        plantWater += creature.mass;
      } else {
        animalWater += creature.mass;
      }
    }
    const water = worldController.worldWater;
    this.populationSamples.push({
      step, plants, animals: generations.currentCreatures.length - plants,
      cloud: water.waterInCloud, cells: water.waterInCells, plantWater, animalWater,
      ...(generations.isContinuous ? { rain: this.stepRain, noRainSteps: this.stepsWithoutRain } : {}),
    });
    this.stepRain = 0;
    this.stepsWithoutRain = 0;
  }

  /** the rain of a step of a continuous run: the water it added, or null when it did not rain */
  recordStepRain(water: number | null) {
    if (water === null) this.stepsWithoutRain++;
    else this.stepRain += water;
  }

  /** a rain of a generational run (the water it added, or null when it did not rain); rains at the same step add up */
  recordRain(water: number | null) {
    const worldController = this.worldController;
    if (!worldController.generations.metabolismEnabled) return;
    const step = (worldController.currentGen - 1) * worldController.stepsPerGen + worldController.currentStep;
    const last = this.rainEvents[this.rainEvents.length - 1];
    if (last && last.step === step) {
      last.water += water ?? 0;
      if (water !== null) delete last.skipped;
      return;
    }
    this.rainEvents.push(water === null ? { step, water: 0, skipped: true } : { step, water });
  }

  copyExceptWorldController(generationRegistry: GenerationRegistry) {
      this.generations = [...generationRegistry.generations];
      this.populationSamples = [...generationRegistry.populationSamples];
      this.rainEvents = [...generationRegistry.rainEvents];
      this.minSurvivorCount = generationRegistry.minSurvivorCount;
      this.maxSurvivorCount = generationRegistry.maxSurvivorCount;
      this.maxFitnessValue = generationRegistry.maxFitnessValue;
  }
}
