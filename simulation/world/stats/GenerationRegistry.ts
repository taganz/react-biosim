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

/** plants and animals alive at the end of a step, in continuous runs with metabolism */
export type PopulationSample = {
  /** steps since the run started: (generation - 1) * stepsPerGen + step */
  step: number;
  plants: number;
  animals: number;
};

/** steps between two population samples: a tenth of the shorter of maxAge and stepsPerGen, at least 1 */
export function populationSampleInterval(maxAge: number, stepsPerGen: number): number {
  return Math.max(1, Math.floor(Math.min(maxAge, stepsPerGen) / 10));
}

export class GenerationRegistry {
  generations: SingleGeneration[] = [];
  populationSamples: PopulationSample[] = [];
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

  // runs after every step; samples only continuous runs with metabolism, every populationSampleInterval() steps
  endStep() {
    const worldController = this.worldController;
    const generations = worldController.generations;
    if (!generations.isContinuous || !generations.metabolismEnabled) return;
    const step = (worldController.currentGen - 1) * worldController.stepsPerGen + worldController.currentStep;
    if (step % populationSampleInterval(generations.maxAge, worldController.stepsPerGen) !== 0) return;
    let plants = 0;
    for (const creature of generations.currentCreatures) {
      if (creature.genus === "plant") plants++;
    }
    this.populationSamples.push({ step, plants, animals: generations.currentCreatures.length - plants });
  }

  copyExceptWorldController(generationRegistry: GenerationRegistry) {
      this.generations = [...generationRegistry.generations];
      this.populationSamples = [...generationRegistry.populationSamples];
      this.minSurvivorCount = generationRegistry.minSurvivorCount;
      this.maxSurvivorCount = generationRegistry.maxSurvivorCount;
      this.maxFitnessValue = generationRegistry.maxFitnessValue;
  }
}
