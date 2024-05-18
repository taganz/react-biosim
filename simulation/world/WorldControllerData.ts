import WorldObject from "@/simulation/world/objects/WorldObject";
import { WaterData } from "@/simulation/water/WaterData";



export default interface WorldControllerData {
    // initial values
    size: number; 
    stepsPerGen: number;
    //initialPopulation: number;
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

    // grid
    worldObjects : WorldObject[];
    
}