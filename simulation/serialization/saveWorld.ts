import WorldController from "../world/WorldController";
import SavedWorld from "./data/SavedWorld";
import generationRegistryFormatter from "./formatters/generationRegistryFormatter";
import serializeWorldControllerData from "./formatters/worldControllerDataSerialization";
import serializeWorldGenerationData from "./formatters/worldGenerationDataSerialization";
import serializeSpecies from "./formatters/speciesSerialitzation";
//import SavedWorldControllerData from "./data/SavedWorldControllerData";


  export function saveWorld(worldController: WorldController): SavedWorld {
  return {

    worldGenerationData: serializeWorldGenerationData(worldController),
    worldControllerData: serializeWorldControllerData(worldController),
    species: serializeSpecies(worldController),
    stats: generationRegistryFormatter.serialize(worldController.generationRegistry)
    
  };
}
