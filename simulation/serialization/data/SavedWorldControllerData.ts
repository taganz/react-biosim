import SavedWorldObject from "@/simulation/serialization/data/SavedWorldObject";


export default interface SavedWorldControllerData {
  // initial values
  size: number; 
  stepsPerGen: number;
  initialPopulation: number;
  worldObjects : SavedWorldObject[];
  gridPointWaterDefault : number;
  gridPointWaterCapacityDefault: number;

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
