
import { SensorName } from "@/simulation/creature/brain/CreatureSensors";
import { ActionName } from "@/simulation/creature/brain/CreatureActions";
import SelectionMethod from "@/simulation/generations/selection/SelectionMethod";
import InsideReproductionAreaSelection from "@/simulation/generations/selection/InsideReproductionAreaSelection";
import PopulationStrategy from "@/simulation/generations/population/PopulationStrategy";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import RandomFixedGenePopulation from "@/simulation/generations/population/RandomFixedGenePopulation";
import AsexualRandomPopulation from "@/simulation/generations/population/AsexualRandomPopulation";
import ReproductionSelection from "@/simulation/generations/selection/ReproductionSelection";
import { MutationMode } from "@/simulation/creature/brain/MutationMode";
import RectangleReproductionArea from "@/simulation/world/areas/reproduction/RectangleReproductionArea";
import RectangleSpawnArea from "@/simulation/world/areas/spawn/RectangleSpawnArea";
import WorldObject from "@/simulation/world/objects/WorldObject";
import RectangleObject from "@/simulation/world/objects/RectangleObject";
import {LogEvent, AllowedLogEvents, LogLevel} from "@/simulation/logger/LogEvent"
import {PhenoTypeColorMode} from "@/simulation/creature/PhenoTypeColorMode";
import ContinuousPopulation from "./generations/population/ContinuousPopulation";
import ContinuousSelection from "./generations/selection/ContinuousSelection";
import WorldGenerationsData from "./generations/WorldGenerationsData";
import WorldControllerData from "./world/WorldControllerData";
import { WaterData } from "./water/WaterData";
import { SimulationData
 } from "./SimulationData";


/*  ----- production setup -----
   STARTUP_MODE = "startupScenario";
*/
    
export const STARTUP_MODE : "simulationDefault" | "startupScenario" = "simulationDefault";

export const CONSTANTS_DEFAULT = {
  
    PRETTIFY_OUTPUT_TO_COPY : true,   
    PRETTIFY_OUTPUT_TO_FILE : true,   

    // -- log 
    LOG_ENABLED : true,  // main switch for logging
    //LOG_RESET_AT_RESTART : true,    // will reset automatically on every restart
    LOG_LEVEL : LogLevel.CREATURE, 
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

    // -- selection method

    POPULATION_DEFAULT_SPECIES : [     // used in RandomFixedGenePopulation
      //{name: "Basic random move", genome: [-2088452096]},
      {name: "Plant-repro and photo", genome: [-2071543808,-2071486464]}
    ],

    SIM_CODE_LENGTH : 3,

    // -- objects

    colors : {
      reproduction: "rgba(0,0,255,0.1)",
      obstacle: "rgb(60, 60, 60)",
      healing: "rgba(0,255,0, 0.1)",
      danger: "rgba(255,0,0, 0.1)",
      spawn: "rgba(255, 255, 0, 0.1)",

    }


  };

export const WORLD_OBJECTS_DATA_DEFAULT : WorldObject[] = [
    // A spawn zone at top left
   // new RectangleSpawnArea(0.1, 0.1, 0.2, 0.2, true),
    // A reproduction zone at  center
   // new RectangleReproductionArea(0.3, 0.6, 0.2, 0.4, true),
    // A map divided at bottom by 5 columns
    new RectangleObject(0.1, 0.6, 0.04, 0.4),
    new RectangleObject(0.3, 0.6, 0.04, 0.4),
    new RectangleObject(0.5, 0.6, 0.04, 0.4),
    new RectangleObject(0.7, 0.6, 0.04, 0.4),
    new RectangleObject(0.9, 0.6, 0.04, 0.4),
  ];

export const WORLD_CONTROLLER_DATA_DEFAULT : WorldControllerData = {
  // initial values
  size : 50,                                // 100
  stepsPerGen: 300,                          // 300

  // model values
  MASS_WATER_TO_MASS_PER_STEP : 0.30, //0.1 - 0.4
  MASS_AT_BIRTH_PLANT : 1,
  MASS_AT_BIRTH_MOVE : 2,
  MASS_AT_BIRTH_ATTACK : 2,
  MASS_AT_BIRTH_ATTACK_AND_MOVE : 3,
  MASS_MAX_MULTIPLE_MASS_AT_BIRT : 5,

  MASS_COST_PER_EXECUTE_ACTION : 0.005, //  0.01 a plant has a minimum of 2 actions and gets energy from photosynthesis

  MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE : 0.004,   // 0.07

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
  pauseBetweenSteps: 10,  // [0 | 10 | 50 | 200]
  immediateSteps: 1,       // [0 | 20 | 200]
  pauseBetweenGenerations: 0, // [0 | 1000 | 4000]
  // state values
  simCode: "XXX",
  currentGen: 0,
  currentStep: 1,
  lastGenerationDuration: 0,
  totalTime: 0,


}

export const WORLD_GENERATIONS_DATA_DEFAULT : WorldGenerationsData = {
  // initial values
  populationStrategy: new ContinuousPopulation(),
  selectionMethod: new ContinuousSelection(),
  initialPopulation: 150,       // 500
  initialGenomeSize: 6,         // 4
  maxGenomeSize: 20,             // 30
  maxNumberNeurons: 15,
  mutationMode: MutationMode.wholeGene,
  mutationProbability: 0.25 ,     // 0.05
  deletionRatio: 0.5,             // 0.5
  geneInsertionDeletionProbability: 0.1,    // 0.015
  enabledSensors: [
    "HorizontalPosition",       // 0
    "VerticalPosition",         // 1
    "Age",                      // 2
    "Oscillator",               // 3
    "Random",                   // 4
    "HorizontalSpeed",          // 5
    "VerticalSpeed",            // 6
    "HorizontalBorderDistance", // 7
    "VerticalBorderDistance",   // 8
    "BorderDistance",           // 9
    "Touch",                    // 10
    "Pain",                     // 11
    "PopulationDensity",        // 12
    "Mass"                     // 13
    
  ],
  enabledActions: [
       "MoveNorth",        // 0
       "MoveSouth",        // 1
       "MoveEast",         // 2
       "MoveWest",         // 3
       "RandomMove",       // 4
       "MoveForward",      // 5
       "Photosynthesis",   // 6 
       "Reproduction",     // 7
       "Attack",           // 8
     ],
  metabolismEnabled: true,    // if false creature mass won't change
  phenotypeColorMode: "trophicLevel",    // "genome", "trophicLevel",
  plantGenes : [-2071543808,-2071486464], // random-2->photosynthesis, random-1->reproduction
  
  // state values 
  lastCreatureIdCreated: 0,
  lastCreatureCount: 0,
  lastSurvivorsCount: 0,
  lastFitnessMaxValue: 0,
  lastSurvivalRate: 0
}

export const WATER_DATA_DEFAULT : WaterData = {
  waterFirstRainPerCell: 50,              // 10
  waterCellCapacity: 100,     // 20
  waterRainMaxPerCell:  30,             // 2
  waterTotalPerCell: 130,       // 
  waterEvaporationPerCellPerGeneration: 10,  // 0
  rainType : "rainTypeUniform",
};

export const SIMULATION_DATA_DEFAULT : SimulationData = {
  constants: CONSTANTS_DEFAULT,
  worldGenerationsData: WORLD_GENERATIONS_DATA_DEFAULT,
  worldControllerData: WORLD_CONTROLLER_DATA_DEFAULT,
  waterData : WATER_DATA_DEFAULT,
  worldObjects: WORLD_OBJECTS_DATA_DEFAULT,
  

  }

