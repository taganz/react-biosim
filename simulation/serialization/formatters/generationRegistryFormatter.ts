import { GenerationRegistry } from "../../world/stats/GenerationRegistry";
import WorldController from "../../world/WorldController";
import SavedGenerationRegistry from "../data/SavedGenerationRegistry";
import { DataFormatter } from "./DataFormatter";

const round2 = (value: number | undefined) => (value === undefined ? undefined : Math.round(value * 100) / 100);

const generationRegistryFormatter: DataFormatter<
  GenerationRegistry,
  SavedGenerationRegistry
> = {
  serialize({
    generations,
    populationSamples,
    rainEvents,
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
      // only runs with metabolism have them. Water rounded to 2 decimals, which keeps the file small
      ...(populationSamples.length > 0
        ? {
            populationSamples: populationSamples.map(({ step: s, plants: p, animals: a, cloud, cells, plantWater, animalWater, rain, noRainSteps }) => ({
              s, p, a, wc: round2(cloud), we: round2(cells), wp: round2(plantWater), wa: round2(animalWater),
              ...(rain !== undefined ? { r: round2(rain), nr: noRainSteps } : {}),
            })),
          }
        : {}),
      ...(rainEvents.length > 0
        ? { rainEvents: rainEvents.map(({ step: s, water, skipped }) => ({ s, w: round2(water)!, ...(skipped ? { k: 1 as const } : {}) })) }
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
    result.populationSamples = (data.populationSamples ?? []).map(({ s: step, p: plants, a: animals, wc, we, wp, wa, r, nr }) => ({
      step, plants, animals,
      // older files have no water
      ...(wc !== undefined ? { cloud: wc, cells: we, plantWater: wp, animalWater: wa } : {}),
      ...(r !== undefined ? { rain: r, noRainSteps: nr } : {}),
    }));
    result.rainEvents = (data.rainEvents ?? []).map(({ s: step, w: water, k }) => ({ step, water, ...(k ? { skipped: true } : {}) }));
    return result;
  },
};

export default generationRegistryFormatter;
