import WorldControllerData from "@/simulation/world/WorldControllerData";
import WorldGenerationsData from "@/simulation/generations/WorldGenerationsData";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import AsexualRandomPopulation from "@/simulation/generations/population/AsexualRandomPopulation";
import InsideReproductionAreaSelection from "@/simulation/generations/selection/InsideReproductionAreaSelection";
import RectangleReproductionArea from "@/simulation/world/areas/reproduction/RectangleReproductionArea";
import RectangleObject from "@/simulation/world/objects/RectangleObject";
import WorldObject from "./world/objects/WorldObject";
import { WaterData } from "./water/WaterData";
import { SimulationData } from "./SimulationData";
import { LogEvent } from "./logger/LogEvent";
import { LogLevel } from "./logger/LogEvent";
import Genome from "./creature/brain/Genome";

const startUpScenarioConstants = {
  
  PRETTIFY_OUTPUT_TO_COPY : true,   
  PRETTIFY_OUTPUT_TO_FILE : true,   

  // -- log 
  LOG_ENABLED : true,  // main switch for logging
  //LOG_RESET_AT_RESTART : true,    // will reset automatically on every restart
  LOG_LEVEL : LogLevel.STEP,
  LOG_CREATURE_ID : 0,   // if 0 all creatures, if -10 ids from 0 to 10, if -30 ids from 0 to 30, else else a id 
  LOG_EVENTLOGGER_MAX_EVENTS : 1000000, // will stop logging at this point
  LOG_LOCALE_STRING : 'es-ES',
  LOG_ALLOWED_EVENTS: {
    // creature
    [LogEvent.INFO]: true,
    [LogEvent.REPRODUCE]: true,
    [LogEvent.REPRODUCE_TRY]: true,
    [LogEvent.PHOTOSYNTHESIS]: true,
    [LogEvent.BIRTH]: true,
    [LogEvent.DEAD]: true,
    [LogEvent.DEAD_ATTACKED]: true,
    [LogEvent.METABOLISM]: true,
    [LogEvent.ATTACK]: true,
    [LogEvent.ATTACK_TRY]: true,
    [LogEvent.MOVE]: true, 
    [LogEvent.MOVE_TRY]: true, 
    // controller
    [LogEvent.GENERATION_START]: true,
    [LogEvent.GENERATION_END]: true,
    [LogEvent.STEP_END]: true,
  },
  GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS : 0.05, 
  GREATEST_MASS_SELECTION_TOP_SURVIVORS : 0.05, 

  // -- selection method

  POPULATION_DEFAULT_SPECIES : [],

  //POPULATION_DEFAULT_GENUS : [{genus: "plant", probability: 0.9},
  //                            {genus: "attack_plant", probability: 0.1}],  // used in RandomFixedGenePopulation
  POPULATION_DEFAULT_GENUS : [],
  
  SIM_CODE_LENGTH : 3,    

  // -- objects

  colors : {
    reproduction: "rgba(0,0,255,0.1)",
    obstacle: "rgb(60, 60, 60)",
    healing: "rgba(0,255,0, 0.1)",
    danger: "rgba(255,0,0, 0.1)",
    spawn: "rgba(255, 255, 0, 0.1)",

  },

  DETECT_RADIUS : 10,    
};

const startupScenarioWorldGenerationsData : WorldGenerationsData = {
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
          MASS_WATER_TO_MASS_PER_STEP : 0.30, //0.1 - 0.4
          MASS_AT_BIRTH_PLANT : 1,
          MASS_AT_BIRTH_ATTACK_PLANT : 2,
          MASS_AT_BIRTH_ATTACK : 2,
          MASS_AT_BIRTH_ATTACK_ANIMAL : 3,
          MASS_MAX_MULTIPLE_MASS_AT_BIRT : 5,

          MASS_COST_PER_EXECUTE_ACTION : 0.01, //  a plant has a minimum of 2 actions and gets energy from photosynthesis

          MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE : 0.04,   // 0.07

          REPRODUCTION_COST_PER_MASS_TRY : 0.1,    
          REPRODUCTION_COST_PER_MASS_DO : 0.25, // 0.3
          REPRODUCTION_MULTIPLE_MASS_AT_BIRTH : 3,    

          ACTION_REPRODUCTION_OFFSET : 0.6,  // will trigger action if input value is greater

          MOVE_COST_PER_MASS_TRY : 0.2,
          MOVE_COST_PER_MASS_DO : 0.6,
          MOVE_MULTIPLE_MASS_AT_BIRTH : 2,    // 2

          ATTACK_COST_PER_MASS_TRY : 0.4,
          ATTACK_COST_PER_MASS_DO : 0,
          ATTACK_MULTIPLE_MASS_AT_BIRTH : 3,     // 0
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
  waterRainMaxPerCell:  0,             // 2
  waterTotalPerCell: 130,       // 
  waterEvaporationPerCellPerGeneration: 0,  // 0
  rainType: "rainTypeUniform"
};

const startupScenarioWorldObjectsData: WorldObject[] = [
          new RectangleReproductionArea(0.47, 0.01, 0.53, 1, true),
          new RectangleObject(0, 0.9, 0.01, 0.01),
      ];
    
export const startUpScenarioSimulationData : SimulationData = {
  constants: startUpScenarioConstants,
  worldGenerationsData: startupScenarioWorldGenerationsData,
  worldControllerData: startupScenarioWorldControllerData,
  waterData : startUpScenarioWaterData,
  worldObjects: startupScenarioWorldObjectsData,
}
      