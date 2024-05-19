import { WaterData } from "@/simulation/water/WaterData";
import WorldController from "@/simulation/world/WorldController";
import { SavedWaterData } from "../data/SavedWaterData";
import { RainType } from "@/simulation/water/RainType";


export function deserializeWaterData(parsed: SavedWaterData) : WaterData {
    const waterData : WaterData = {
      waterFirstRainPerCell: parsed.waterFirstRainPerCell,
      waterCellCapacity: parsed.waterCellCapacity,
      waterRainMaxPerCell: parsed.waterRainMaxPerCell,
      waterTotalPerCell: parsed.waterTotalPerCell,
      waterEvaporationPerCellPerGeneration: parsed.waterEvaporationPerCellPerGeneration,
      rainType : parsed.rainType as RainType
    }
    return waterData;
}
    

export function serializeWaterData(worldController: WorldController) : SavedWaterData {
  const waterData = worldController.simData.waterData;
  const parsed : SavedWaterData = {
    waterFirstRainPerCell: waterData.waterFirstRainPerCell,
    waterCellCapacity: waterData.waterCellCapacity,
    waterRainMaxPerCell: waterData.waterRainMaxPerCell,
    waterTotalPerCell: waterData.waterTotalPerCell,
    waterEvaporationPerCellPerGeneration: waterData.waterEvaporationPerCellPerGeneration,
    rainType : waterData.rainType as string
  };
  return parsed;
}
