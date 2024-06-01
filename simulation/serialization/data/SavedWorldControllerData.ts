import SavedWorldObject from "@/simulation/serialization/data/SavedWorldObject";
import { WaterData } from "@/simulation/water/WaterData";

export default interface SavedWorldControllerData {
  // initial values
  size: number; 
  stepsPerGen: number;
  
  // model values
  MASS_WATER_TO_MASS_PER_STEP : number; 
  MASS_AT_BIRTH_PLANT : number; 
  MASS_AT_BIRTH_ATTACK_PLANT : number; 
  MASS_AT_BIRTH_ATTACK : number; 
  MASS_AT_BIRTH_ATTACK_ANIMAL : number; 
  MASS_MAX_MULTIPLE_MASS_AT_BIRT : number; 
  
  MASS_COST_PER_EXECUTE_ACTION : number; 

  MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE : number; 

  REPRODUCTION_COST_PER_MASS_TRY : number; 
  REPRODUCTION_COST_PER_MASS_DO : number; 
  REPRODUCTION_MULTIPLE_MASS_AT_BIRTH : number;     

  ACTION_REPRODUCTION_OFFSET : number; 

  MOVE_COST_PER_MASS_TRY : number; 
  MOVE_COST_PER_MASS_DO : number; 
  MOVE_MULTIPLE_MASS_AT_BIRTH : number; 

  ATTACK_COST_PER_MASS_TRY : number; 
  ATTACK_COST_PER_MASS_DO : number; 
  ATTACK_MULTIPLE_MASS_AT_BIRTH : number; 
  ATTACK_MIN_PREY_MASS_FACTOR : number;

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
