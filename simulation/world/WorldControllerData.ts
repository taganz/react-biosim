import WorldObject from "@/simulation/world/objects/WorldObject";

export default interface WorldControllerData {
    // initial values
    size: number; 
    stepsPerGen: number;
    initialPopulation: number;
    worldObjects : WorldObject[];
    gridPointWaterDefault: number;
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