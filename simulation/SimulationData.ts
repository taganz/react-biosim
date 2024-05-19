import { Species } from "./creature/Species";
import WorldGenerationsData from "./generations/WorldGenerationsData";
import WorldControllerData from "./world/WorldControllerData";
import WorldObject from "./world/objects/WorldObject";
import { GenerationRegistry } from "./world/stats/GenerationRegistry";
import { WaterData } from "./water/WaterData";

export type SimulationData = {
    constants: any;
    worldGenerationsData: WorldGenerationsData;
    worldControllerData: WorldControllerData;
    waterData : WaterData;
    worldObjects: WorldObject[];
    species?: Species[];
    stats?: GenerationRegistry
}