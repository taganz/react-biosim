import SavedWorldObject from "@/simulation/serialization/data/SavedWorldObject";
import { WaterData } from "@/simulation/world/WorldControllerData";

export default interface SavedWorldControllerData {
  // initial values
  size: number; 
  stepsPerGen: number;
  initialPopulation: number;
  worldObjects : SavedWorldObject[];
  waterFirstRainPerCell : number;
  waterCellCapacity: number;
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
