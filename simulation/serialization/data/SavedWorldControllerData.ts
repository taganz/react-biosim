import SavedWorldObject from "@/simulation/serialization/data/SavedWorldObject";


export default interface SavedWorldControllerData {
  // initial values
  size: number; 
  stepsPerGen: number;
  initialPopulation: number;
  worldObjects : SavedWorldObject[];
  gridPointWaterDefault : number;

  // user values
  pauseBetweenSteps: number;
  immediateSteps: number;
  pauseBetweenGenerations: number;
  
  // state values
  currentGen: number;
  currentStep: number;
  lastGenerationDuration: number;
  totalTime: number;

}
