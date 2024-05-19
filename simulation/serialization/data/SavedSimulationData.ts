import SavedWorldControllerData from "./SavedWorldControllerData";
import SavedWorldGenerationData from "./SavedWorldGenerationData";
import SavedWorldObject from "./SavedWorldObject";
import SavedGenerationRegistry from "./SavedGenerationRegistry";
import SavedSpecies from "./SavedSpecies";
import { SavedWaterData } from "./SavedWaterData";

export type SavedSimulationData = {
    constants: string;
    worldGenerationsData: SavedWorldGenerationData;
    worldControllerData: SavedWorldControllerData;
    worldObjects: SavedWorldObject[];
    waterData: SavedWaterData;
    species?: SavedSpecies[];
    stats?: SavedGenerationRegistry
}