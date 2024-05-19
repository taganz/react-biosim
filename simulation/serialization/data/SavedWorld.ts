import SavedWorldGenerationData from "./SavedWorldGenerationData";
import SavedWorldControllerData from "./SavedWorldControllerData";
import SavedSpecies from "./SavedSpecies";
import SavedGenerationRegistry from "./SavedGenerationRegistry";
import SavedWorldObject from "./SavedWorldObject";
import WorldControllerData from "@/simulation/world/WorldControllerData";

export default interface SavedWorld {
  worldGenerationsData: SavedWorldGenerationData;
  worldControllerData: WorldControllerData;
  worldObjects: SavedWorldObject[];
  species?: SavedSpecies[];
  stats?: SavedGenerationRegistry
}

