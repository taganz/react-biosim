import WorldObject from "@/simulation/world/objects/WorldObject";

export default interface WorldControllerData {
    // initial values
    size: number; 
    stepsPerGen: number;
    initialPopulation: number;
    worldObjects : WorldObject[];
    gridPointWaterDefault: number;
    

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