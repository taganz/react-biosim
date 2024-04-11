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
    if (this.worldController.currentGen > 0) {
      const generation = this.worldController.currentGen - 1;
      const survivorCount = this.worldController.lastSurvivorsCount;
      const startingPopulation = this.worldController.lastCreatureCount;
      const maxFitnessValue = this.worldController.lastFitnessMaxValue;

      if (survivorCount > this.maxSurvivorCount) {
        this.maxSurvivorCount = survivorCount;
      }

      if (survivorCount < this.minSurvivorCount) {
        this.minSurvivorCount = survivorCount;
      }

      
      this.generations.push({ generation, survivorCount, startingPopulation, maxFitnessValue });
    }
  }
}
