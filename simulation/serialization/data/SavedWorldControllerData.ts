import SavedWorldObject from "@/simulation/serialization/data/SavedWorldObject";
import { WaterData } from "@/simulation/water/WaterData";

export default interface SavedWorldControllerData {
  // initial values
  size: number; 
  stepsPerGen: number;
  //initialPopulation: number;
  //waterFirstRainPerCell : number;
  //waterCellCapacity: number;
  waterData : WaterData;
  worldObjects : SavedWorldObject[];
  
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
