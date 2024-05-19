import WorldController from "../world/WorldController";
import SavedWorld from "./data/SavedWorld";
import generationRegistryFormatter from "./formatters/generationRegistryFormatter";
import serializeWorldGenerationData from "./formatters/worldGenerationDataSerialization";
import serializeSpecies from "./formatters/speciesSerialitzation";
import { serializeObjects } from "./formatters/objectsSerialization";
//import SavedWorldControllerData from "./data/SavedWorldControllerData";


  export function saveWorld(worldController: WorldController): SavedWorld {
  return {

    worldGenerationsData: serializeWorldGenerationData(worldController),
    worldControllerData: worldController._loadedWorldControllerData,
    worldObjects: serializeObjects(worldController.objects),
    species: serializeSpecies(worldController),
    stats: generationRegistryFormatter.serialize(worldController.generationRegistry)
    
  };
}
