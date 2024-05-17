import WorldObject from "@/simulation/world/objects/WorldObject";


export type WaterData = {
    waterFirstRainPerCell: number;
    waterCellCapacity: number;
    waterRainMaxPerCell: number,
    waterTotalPerCell: number,
    waterEvaporationPerCellPerGeneration: number,
  };


export default interface WorldControllerData {
    // initial values
    size: number; 
    stepsPerGen: number;
    //initialPopulation: number;
    worldObjects : WorldObject[];
    waterData : WaterData;

    // user values
    pauseBetweenSteps: number;
    immediateSteps: number;
    pauseBetweenGenerations: number;
    
    // state values
    simCode: string;
    currentGen: number;
    currentStep: number;
    lastGenerationDuration: number;
    totalTime: number;
}