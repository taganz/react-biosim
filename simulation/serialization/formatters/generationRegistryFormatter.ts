import { GenerationRegistry } from "../../world/stats/GenerationRegistry";
import WorldController from "../../world/WorldController";
import SavedGenerationRegistry from "../data/SavedGenerationRegistry";
import { DataFormatter } from "./DataFormatter";

const generationRegistryFormatter: DataFormatter<
  GenerationRegistry,
  SavedGenerationRegistry
> = {
  serialize({
    generations,
    maxSurvivorCount,
    minSurvivorCount,
    maxFitnessValue
  }: GenerationRegistry) {
    return {
      generations: generations.map(
        ({ generation: g, startingPopulation: sP, survivorCount: sC, maxFitnessValue: fV, births: b, deaths: d }) => ({
          g,
          sP,
          sC,
          fV,
          b,
          d
        })
      ),
      maxSurvivorCount,
      minSurvivorCount,
      maxFitnessValue
    };
  },
  deserialize(data: SavedGenerationRegistry, worldController: WorldController): GenerationRegistry {
    const result = new GenerationRegistry(worldController);
    result.maxSurvivorCount = data.maxSurvivorCount;
    result.minSurvivorCount = data.minSurvivorCount;
    result.generations = data.generations.map(
      ({ g: generation, sP: startingPopulation, sC: survivorCount, fV: maxFitnessValue, b: births, d: deaths }) => ({
        generation,
        startingPopulation,
        survivorCount,
        maxFitnessValue,
        births,
        deaths
      })
    );
    return result;
  },
};

export default generationRegistryFormatter;
