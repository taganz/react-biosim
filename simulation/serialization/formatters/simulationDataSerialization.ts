import { SimulationData } from "@/simulation/SimulationData";
import { SavedSimulationData } from "../data/SavedSimulationData";
import SavedWorldControllerData from "../data/SavedWorldControllerData";
import { serializeWorldGenerationData, deserializeWorldGenerationData } from "./worldGenerationDataSerialization";
import { serializeObjects, deserializeObjects } from "./objectsSerialization";
import WorldControllerData from "@/simulation/world/WorldControllerData";
import { WaterData } from "@/simulation/water/WaterData";
import WorldController from "@/simulation/world/WorldController";
import generationRegistryFormatter from "./generationRegistryFormatter";
import serializeSpecies from "./speciesSerialization";
import { deserializeSpecies } from "./speciesSerialization";
import {serializeWaterData, deserializeWaterData} from "./waterDataSerialization";
import SavedStartGenome from "../data/SavedStartGenome";
import Genome from "@/simulation/creature/brain/Genome";
import {serializeWorldControllerData, deserializeWorldControllerData} from "./worldControllerDataSerialization";

/*
function loadGenerationRegistry(worldController: WorldController, parsed: SavedWorld) : void {
    // Load generation registry
    if (parsed.stats) {
      worldController.generationRegistry = generationRegistryFormatter.deserialize(
        parsed.stats,
        worldController
      );
    } else {
      worldController.generationRegistry = new GenerationRegistry(worldController);
    }
  
}
*/

export default function deserializeSimulationData(worldController: WorldController, parsed: SavedSimulationData) : SimulationData {
  // species, stats and startGenomes are optional: a setup has none of them
    const simulationData : SimulationData = {
        constants : parsed.constants,
        worldGenerationsData : deserializeWorldGenerationData(parsed),
        worldControllerData : deserializeWorldControllerData(parsed.worldControllerData),
        waterData : deserializeWaterData(parsed.waterData),
        worldObjects : deserializeObjects(parsed.worldObjects),
        species : parsed.species === undefined ? undefined : deserializeSpecies(worldController, parsed.species),
        stats : (parsed.stats === undefined || Object.keys(parsed.stats).length === 0) ? undefined : generationRegistryFormatter.deserialize(parsed.stats),
        startGenomes : parsed.startGenomes === undefined ? undefined : deserializeStartGenomes(parsed.startGenomes),
      // export function deserializeObjects
      //    worldObjects: [...deserializeObjects(parsed.worldControllerData.worldObjects)],
    }
    return simulationData;
}
    

export function serializeSimulationData(worldController: WorldController) : SavedSimulationData {
  const sim = worldController.simData;  
  const serializedSimulationData : SavedSimulationData = {
        constants : sim.constants, // JSON.stringify(sim.constants),
        worldGenerationsData : serializeWorldGenerationData(worldController),
        worldControllerData : serializeWorldControllerData(worldController),
        waterData : deserializeWaterData(sim.waterData),
        worldObjects : serializeObjects(sim.worldObjects),
        species: serializeSpecies(worldController),
        stats: generationRegistryFormatter.serialize(worldController.generationRegistry)
       
      // export function deserializeObjects
      //    worldObjects: [...deserializeObjects(parsed.worldControllerData.worldObjects)],
    }
    return serializedSimulationData;
}

// settings and map only: loading it starts a new run from generation 1
export function serializeSetup(worldController: WorldController) : SavedSimulationData {
  const { species, stats, ...setup } = serializeSimulationData(worldController);
  return {
    ...setup,
    worldControllerData: { ...setup.worldControllerData, currentGen: 1, currentStep: 1, lastGenerationDuration: 0, totalTime: 0 },
  };
}

/**
 * Settings, map and the genomes of the current generation as it started, without positions:
 * loading it starts that generation again. The stats history is optional because it is
 * most of the size of a long run.
 */
export function serializeGenerationStart(worldController: WorldController, includeStats: boolean) : SavedSimulationData {
  const { species, stats, ...setup } = serializeSimulationData(worldController);
  return {
    ...setup,
    worldControllerData: { ...setup.worldControllerData, currentStep: 1 },
    ...(includeStats ? { stats } : {}),
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
