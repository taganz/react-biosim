import SavedWorldControllerData from "./SavedWorldControllerData";
import SavedWorldGenerationData from "./SavedWorldGenerationData";
import SavedWorldObject from "./SavedWorldObject";
import SavedGenerationRegistry from "./SavedGenerationRegistry";
import SavedSpecies from "./SavedSpecies";
import SavedStartGenome from "./SavedStartGenome";
import { WaterData } from "@/simulation/water/WaterData";

/** The current file format. Older files are brought to it by migrateSavedSimulationData() */
export type SavedSimulationData = {
    /** SAVE_FORMAT_VERSION when it was saved */
    version: number;
    constants: any;
    worldGenerationsData: SavedWorldGenerationData;
    worldControllerData: SavedWorldControllerData;
    worldObjects: SavedWorldObject[];
    waterData: WaterData;
    species?: SavedSpecies[];
    stats?: SavedGenerationRegistry;
    /** Saved at the start of a generation: its genomes. Loading starts that generation with them */
    startGenomes?: SavedStartGenome[];
    /** Water of each cell, row by row (y, then x), saved with the creatures. Older files do not have it */
    cellWater?: number[];
}
