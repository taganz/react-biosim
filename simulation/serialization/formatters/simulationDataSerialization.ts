import { SimulationData } from "@/simulation/SimulationData";
import { SavedSimulationData } from "../data/SavedSimulationData";
import { serializeWorldGenerationData, deserializeWorldGenerationData } from "./worldGenerationDataSerialization";
import { serializeObjects, deserializeObjects } from "./objectsSerialization";
import WorldController from "@/simulation/world/WorldController";
import generationRegistryFormatter from "./generationRegistryFormatter";
import serializeSpecies from "./speciesSerialization";
import { deserializeSpecies } from "./speciesSerialization";
import SavedStartGenome from "../data/SavedStartGenome";
import Genome from "@/simulation/creature/brain/Genome";
import {serializeWorldControllerData} from "./worldControllerDataSerialization";
import WorldWater from "@/simulation/water/WorldWater";
import migrateSavedSimulationData, { SAVE_FORMAT_VERSION } from "../migrateSavedSimulationData";

// takes a parsed file of any version: migrateSavedSimulationData() brings it to the current format
export default function deserializeSimulationData(worldController: WorldController, file: unknown) : SimulationData {
    const parsed = migrateSavedSimulationData(file);
    // species, stats and startGenomes are optional: a setup has none of them
    return {
        constants : parsed.constants,
        worldGenerationsData : deserializeWorldGenerationData(parsed.worldGenerationsData),
        worldControllerData : { ...parsed.worldControllerData },
        waterData : { ...parsed.waterData },
        worldObjects : deserializeObjects(parsed.worldObjects),
        species : parsed.species === undefined ? undefined : deserializeSpecies(worldController, parsed.species),
        stats : (parsed.stats === undefined || Object.keys(parsed.stats).length === 0) ? undefined : generationRegistryFormatter.deserialize(parsed.stats),
        startGenomes : parsed.startGenomes === undefined ? undefined : deserializeStartGenomes(parsed.startGenomes),
        cellWater : parsed.cellWater,
    };
}
    

// includeStats: false leaves out the stats history, which is most of the size of a long run
export function serializeSimulationData(worldController: WorldController, includeStats: boolean = true) : SavedSimulationData {
  const sim = worldController.simData;  
  const serializedSimulationData : SavedSimulationData = {
        version : SAVE_FORMAT_VERSION,
        constants : sim.constants,
        worldGenerationsData : serializeWorldGenerationData(worldController),
        worldControllerData : serializeWorldControllerData(worldController),
        waterData : { ...sim.waterData },
        worldObjects : serializeObjects(sim.worldObjects),
        species: serializeSpecies(worldController),
        // rounded: 3 decimals are far below what a creature takes in a step, and keep the file small
        cellWater: WorldWater.cellWater(worldController.grid).map((water) => Math.round(water * 1000) / 1000),
        ...(includeStats ? { stats: generationRegistryFormatter.serialize(worldController.generationRegistry) } : {}),
    }
    return serializedSimulationData;
}

// settings and map only: loading it starts a new run from generation 1
export function serializeSetup(worldController: WorldController) : SavedSimulationData {
  const { species, cellWater, ...setup } = serializeSimulationData(worldController, false);
  // the seed setting stays; the random state belongs to the run
  const { runSeed, rngState, ...worldControllerData } = setup.worldControllerData;
  return {
    ...setup,
    worldControllerData: { ...worldControllerData, currentGen: 1, currentStep: 1, lastGenerationDuration: 0, totalTime: 0 },
  };
}

/**
 * Settings, map and the genomes of the current generation as it started, without positions:
 * loading it starts that generation again. The stats history is optional because it is
 * most of the size of a long run.
 */
export function serializeGenerationStart(worldController: WorldController, includeStats: boolean) : SavedSimulationData {
  // a generation starts with the first rain, so the cell water is not saved either
  const { species, cellWater, ...setup } = serializeSimulationData(worldController, includeStats);
  return {
    ...setup,
    worldControllerData: { ...setup.worldControllerData, currentStep: 1 },
    startGenomes: serializeStartGenomes(worldController.generations.startGenomes),
  };
}

// creatures that share a genome are saved once, with a count; most common first
function serializeStartGenomes(genomes: Genome[]) : SavedStartGenome[] {
  const byGenome = new Map<string, SavedStartGenome>();
  for (const genome of genomes) {
    const key = genome.toDecimalString(false);
    const saved = byGenome.get(key);
    if (saved) {
      saved.count++;
    } else {
      byGenome.set(key, { genes: [...genome.genes], count: 1 });
    }
  }
  return Array.from(byGenome.values()).sort((a, b) => b.count - a.count);
}

function deserializeStartGenomes(saved: SavedStartGenome[]) : Genome[] {
  return saved.flatMap(({ genes, count }) => Array.from({ length: count }, () => new Genome([...genes])));
}
