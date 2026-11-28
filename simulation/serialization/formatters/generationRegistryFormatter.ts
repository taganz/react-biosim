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
    populationSamples,
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
      // only continuous runs with metabolism have them
      ...(populationSamples.length > 0
        ? { populationSamples: populationSamples.map(({ step: s, plants: p, animals: a }) => ({ s, p, a })) }
        : {}),
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
    result.populationSamples = (data.populationSamples ?? []).map(({ s: step, p: plants, a: animals }) => ({ step, plants, animals }));
    return result;
  },
};

export default generationRegistryFormatter;
