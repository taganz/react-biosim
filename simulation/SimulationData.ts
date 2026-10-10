import { Species } from "./creature/Species";
import WorldGenerationsData from "./generations/WorldGenerationsData";
import WorldControllerData from "./world/WorldControllerData";
import WorldObject from "./world/objects/WorldObject";
import { GenerationRegistry } from "./world/stats/GenerationRegistry";
import { WaterData } from "./water/WaterData";

/**
 * Everything that defines a simulation: settings, map and, for a resumed run,
 * its creatures and stats. Fields are listed in docs/reference/parameters.md
 */
export type SimulationData = {
    /** Advanced options not shown in the UI (logging, selection percentages, colors...) */
    constants: any;
    worldGenerationsData: WorldGenerationsData;
    worldControllerData: WorldControllerData;
    waterData : WaterData;
    worldObjects: WorldObject[];
    /** Creatures to restore in resumeRun(); undefined for a new run */
    species?: Species[];
    /** Fitness history to restore in resumeRun() */
    stats?: GenerationRegistry
}