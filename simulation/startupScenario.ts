import WorldControllerData from "@/simulation/world/WorldControllerData";
import WorldGenerationsData from "@/simulation/generations/WorldGenerationsData";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import AsexualRandomPopulation from "@/simulation/generations/population/AsexualRandomPopulation";
import InsideReproductionAreaSelection from "@/simulation/generations/selection/InsideReproductionAreaSelection";
import RectangleReproductionArea from "@/simulation/world/areas/reproduction/RectangleReproductionArea";
import RectangleObject from "@/simulation/world/objects/RectangleObject";
import WorldObject from "./world/objects/WorldObject";
import { WaterData } from "./water/WaterData";
import { SimulationData } from "./SimulationData";
import { CONSTANTS_DEFAULT } from "./constantsDefault";

/*
 * The default settings: the app opens with them, the headless runner starts from them,
 * and the tests build their own configuration from them (__tests__/support/testSimulationData.ts).
 */

const startupScenarioWorldGenerationsData : WorldGenerationsData = {
    simulationType: "generational",
    maxAge: 1000,
    populationStrategy: new AsexualRandomPopulation,
    selectionMethod: new InsideReproductionAreaSelection,
    initialPopulation: 1000,
    initialGenomeSize: 4,
    maxGenomeSize: 4,
    maxNumberNeurons: 1,
    mutationMode: MutationMode.wholeGene,
    mutationProbability: 0.05,
    deletionRatio: 0.5,
    geneInsertionDeletionProbability: 0.015,
    enabledSensors: [
            "HorizontalPosition",
            "VerticalPosition",
            "Age",
            "Oscillator",
            "Random",
            "HorizontalSpeed",
            "VerticalSpeed",
            "HorizontalBorderDistance",
            "VerticalBorderDistance",
            "BorderDistance"
          ],
    enabledActions: [
            "MoveNorth",
            "MoveSouth",
            "MoveEast",
            "MoveWest",
            "RandomMove",
            "MoveForward"
          ],
    metabolismEnabled: false,
    phenotypeColorMode: "genome",
    plantGenes : [-2071543808,-2071486464], // random-2->photosynthesis, random-1->reproduction

    // state values 
    lastCreatureIdCreated: 0,
    lastCreatureCount: 0,
    lastSurvivorsCount: 0,
    lastFitnessMaxValue: 0,
    lastSurvivalRate: 0,
};

const startupScenarioWorldControllerData : WorldControllerData = {
        // initial values
        size: 100, 
        stepsPerGen: 300,


          // model values
          MASS_WATER_TO_MASS_PER_STEP : 0.05, //0.1 - 0.4
          MASS_AT_BIRTH_PLANT : 1,
          MASS_AT_BIRTH_ATTACK_PLANT : 3,
          MASS_AT_BIRTH_ATTACK : 2,
          MASS_AT_BIRTH_ATTACK_ANIMAL : 6,
          MASS_MAX_MULTIPLE_MASS_AT_BIRT : 5,

          MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE : 0.04,   // 0.07
          MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY : 0.01,   // the first Photosynthesis gene and the first Reproduction gene

          REPRODUCTION_COST_PER_MASS_TRY : 0.1,    
          REPRODUCTION_COST_PER_MASS_DO : 0.25, // 0.3
          REPRODUCTION_MULTIPLE_MASS_AT_BIRTH : 3,    

          ACTION_REPRODUCTION_OFFSET : 0.6,  // not used
          ACTION_ATTACK_OFFSET : 0.6,  // the attack actions fire if their output is greater

          MOVE_COST_PER_MASS_TRY : 0.2,
          MOVE_COST_PER_MASS_DO : 0.6,
          MOVE_MULTIPLE_MASS_AT_BIRTH : 0, // 2,    // 2

          ATTACK_COST_PER_MASS_TRY : 0.02,
          ATTACK_COST_PER_MASS_DO : 0,
          ATTACK_MIN_PREY_MASS_FACTOR : 2,      // 0

        // user values
        pauseBetweenSteps: 10,
        immediateSteps: 1,
        pauseBetweenGenerations: 0,
        
        // state values
        simCode: "SC1",
        currentGen: 1,
        currentStep: 1,
        lastGenerationDuration: 0,
        totalTime: 0



    };

const startUpScenarioWaterData : WaterData = {
  waterFirstRainPerCell: 50,              // 10
  waterCellCapacity: 400,     // 20
  waterRainMaxPerCell:  50,            // 2
  waterTotalPerCell: 130,       // 
  waterEvaporationPerCellPerGeneration: 10, // 0
  rainType: "rainTypeUniform"
};

const startupScenarioWorldObjectsData: WorldObject[] = [
          new RectangleReproductionArea(0.47, 0.01, 0.53, 1, true),
          new RectangleObject(0, 0.9, 0.01, 0.01),
      ];
    
export const startUpScenarioSimulationData : SimulationData = {
  constants: { ...CONSTANTS_DEFAULT },
  worldGenerationsData: startupScenarioWorldGenerationsData,
  worldControllerData: startupScenarioWorldControllerData,
  waterData : startUpScenarioWaterData,
  worldObjects: startupScenarioWorldObjectsData,
}
      