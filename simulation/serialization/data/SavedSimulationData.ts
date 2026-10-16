import SavedWorldControllerData from "./SavedWorldControllerData";
import SavedWorldGenerationData from "./SavedWorldGenerationData";
import SavedWorldObject from "./SavedWorldObject";
import SavedGenerationRegistry from "./SavedGenerationRegistry";
import SavedSpecies from "./SavedSpecies";
import { SavedWaterData } from "./SavedWaterData";
import SavedStartGenome from "./SavedStartGenome";

export type SavedSimulationData = {
    constants: string;
    worldGenerationsData: SavedWorldGenerationData;
    worldControllerData: SavedWorldControllerData;
    worldObjects: SavedWorldObject[];
    waterData: SavedWaterData;
    species?: SavedSpecies[];
    stats?: SavedGenerationRegistry;
    /** Saved at the start of a generation: its genomes. Loading starts that generation with them */
    startGenomes?: SavedStartGenome[];
    /** Water of each cell, row by row (y, then x), saved with the creatures. Older files do not have it */
    cellWater?: number[];
}
