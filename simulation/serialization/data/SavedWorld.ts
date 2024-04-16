import SavedWorldGenerationData from "./SavedWorldGenerationData";
import SavedWorldControllerData from "./SavedWorldControllerData";
import SavedSpecies from "./SavedSpecies";
import SavedGenerationRegistry from "./SavedGenerationRegistry";

export default interface SavedWorld {
  worldGenerationData: SavedWorldGenerationData;
  worldControllerData: SavedWorldControllerData;
  species?: SavedSpecies[];
  stats?: SavedGenerationRegistry
}

