import World from "../World";

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

  constructor(public world: World) {}

  startGeneration() {
    // Register generation stats
    if (this.world.currentGen > 0) {
      const generation = this.world.currentGen - 1;
      const survivorCount = this.world.lastSurvivorsCount;
      const startingPopulation = this.world.lastCreatureCount;
      const maxFitnessValue = this.world.lastFitnessMaxValue;

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
