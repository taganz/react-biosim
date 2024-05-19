import { RainType } from "./RainType";

export type WaterData = {
    waterFirstRainPerCell: number;
    waterCellCapacity: number;
    waterRainMaxPerCell: number,
    waterTotalPerCell: number,
    waterEvaporationPerCellPerGeneration: number,
    rainType : RainType

  };
