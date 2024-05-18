import WorldControllerData from "@/simulation/world/WorldControllerData";

export const testWorldControllerData : WorldControllerData = {
    // initial values
    size: 5, 
    stepsPerGen: 10,
    //initialPopulation: 1,
    worldObjects : [],
    //waterFirstRainPerCell: 10,
    //waterCellCapacity: 20,
    waterData : {
        waterFirstRainPerCell: 50,              // 10
        waterCellCapacity: 400,     // 20
        waterRainMaxPerCell:  0,             // 2
        waterTotalPerCell: 130,       // 
        waterEvaporationPerCellPerGeneration: 0,  // 0
      },

    // user values
    pauseBetweenSteps: 0,
    immediateSteps: 1,
    pauseBetweenGenerations: 0,
    
    // state values
    simCode: "TST",
    currentGen: 1,
    currentStep: 1,
    lastGenerationDuration: 0,
    totalTime: 0
};