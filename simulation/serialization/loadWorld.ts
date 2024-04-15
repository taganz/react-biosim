
import { GenerationRegistry } from "../world/stats/GenerationRegistry";
import WorldController from "../world/WorldController";
import WorldControllerData from "../world/WorldControllerData";
import SavedWorld from "./data/SavedWorld";
import generationRegistryFormatter from "./formatters/generationRegistryFormatter";
import WorldGenerationData from "../world/WorldGenerationData";
import {deserializeSpecies} from "./formatters/speciesSerialitzation";
import {deserializeWorldGenerationData} from "./formatters/worldGenerationDataSerialization"
import {deserializeWorldControllerData} from "./formatters/worldControllerDataSerialization"


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
  

export function loadSavedWorldAndResumeRun(worldController: WorldController, data: string) : [WorldControllerData, WorldGenerationData] {
  
  const parsed = JSON.parse(data) as SavedWorld;
  
  worldController.pause();

  const worldGenerationData = deserializeWorldGenerationData(parsed);
  const worldControllerData = deserializeWorldControllerData(parsed);
  const species = deserializeSpecies(worldController, parsed.species);
  const stats = generationRegistryFormatter.deserialize(parsed.stats,worldController);
  
  worldController.resumeRun(worldControllerData, worldGenerationData, species, stats);

  return [worldControllerData, worldGenerationData];
}
