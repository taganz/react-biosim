import WorldController from "../WorldController";

export type SingleGeneration = {
  generation: number;
  survivorCount: number;
  startingPopulation: number;
  maxFitnessValue : number;
};

export class GenerationRegistry {
  generations: SingleGeneration[] = [];
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

      if (survivorCount > this.maxSurvivorCount) {
        this.maxSurvivorCount = survivorCount;
      }

      if (survivorCount < this.minSurvivorCount) {
        this.minSurvivorCount = survivorCount;
      }

      //console.log("gen registry: ", this.worldController.currentGen, ".", this.worldController.currentStep," ----", generation, survivorCount, startingPopulation, maxFitnessValue )      ;
      this.generations.push({ generation, survivorCount, startingPopulation, maxFitnessValue });
    }
  }

  copyExceptWorldController(generationRegistry: GenerationRegistry) {
      this.generations = [...generationRegistry.generations];
      this.minSurvivorCount = generationRegistry.minSurvivorCount;
      this.maxSurvivorCount = generationRegistry.maxSurvivorCount;
      this.maxFitnessValue = generationRegistry.maxFitnessValue;
  }
}
