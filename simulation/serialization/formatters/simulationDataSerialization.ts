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
import {serializeWaterData, deserializeWaterData} from "./waterDataSerialization";
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

export default function deserializeSimulationData(parsed: SavedSimulationData) : SimulationData {
  //TODO to be reviewed
  if (!parsed.species) {
    throw new Error("must have parsed.species");
  }
  if (!parsed.stats) {
    throw new Error("must have parsed.species");
  }
    const simulationData : SimulationData = {
        constants : parsed.constants,
        worldGenerationsData : deserializeWorldGenerationData(parsed),
        worldControllerData : deserializeWorldControllerData(parsed.worldControllerData),
        waterData : deserializeWaterData(parsed.waterData),
        worldObjects : deserializeObjects(parsed.worldObjects)
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
