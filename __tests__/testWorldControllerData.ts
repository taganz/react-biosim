import WorldControllerData from "@/simulation/world/WorldControllerData";

export const testWorldControllerData : WorldControllerData = {
    // initial values
    size: 5, 
    stepsPerGen: 10,
    initialPopulation: 1,
    worldObjects : [],
    gridPointWaterDefault: 10,
    gridPointWaterCapacityDefault: 20,

    // user values
    pauseBetweenSteps: 0,
    immediateSteps: 1,
    pauseBetweenGenerations: 0,
    
    // state values
    simCode: "TST",
    currentGen: 0,
    currentStep: 0,
    lastGenerationDuration: 0,
    totalTime: 0
};