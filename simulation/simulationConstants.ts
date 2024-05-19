
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
/*  ----- production setup -----
 STARTUP_MODE = "startupScenario";
*/

export const STARTUP_MODE : "simulationConstants" | "startupScenario" = "simulationConstants";  


export const PRETTIFY_OUTPUT_TO_COPY = true;   
export const PRETTIFY_OUTPUT_TO_FILE = true;   

// -- log 
export const LOG_ENABLED : boolean = true;  // main switch for logging
//export const LOG_RESET_AT_RESTART = true;    // will reset automatically on every restart
export const LOG_LEVEL : LogLevel = LogLevel.CREATURE; 
export const LOG_CREATURE_ID : number = 0;   // if 0 all creatures, if -10 ids from 0 to 10, if -30 ids from 0 to 30, else else a id 
export const LOG_EVENTLOGGER_MAX_EVENTS = 1000000; // will stop logging at this point
export const LOG_LOCALE_STRING = 'es-ES';
export const LOG_ALLOWED_EVENTS: AllowedLogEvents = {
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
}


/*
// -- metabolism 
export const MASS_METABOLISM_GENES = [-2071543808,-2071486464]; // random-2->photosynthesis, random-1->reproduction
export const MASS_WATER_TO_MASS_PER_STEP = 0.30; //0.1 - 0.4
export const MASS_AT_BIRTH_PLANT = 1;
export const MASS_AT_BIRTH_MOVE = 2;
export const MASS_AT_BIRTH_ATTACK = 2;
export const MASS_AT_BIRTH_ATTACK_AND_MOVE = 3;
export const MASS_MAX_MULTIPLE_MASS_AT_BIRT = 5;

export const MASS_COST_PER_EXECUTE_ACTION = 0.01; //  a plant has a minimum of 2 actions and gets energy from photosynthesis

export const MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE = 0.04;   // 0.07

export const REPRODUCTION_COST_PER_MASS_TRY = 0.1;    
export const REPRODUCTION_COST_PER_MASS_DO = 0.25; // 0.3
export const REPRODUCTION_MULTIPLE_MASS_AT_BIRTH = 3;    

export const ACTION_REPRODUCTION_OFFSET = 0.6;  // will trigger action if input value is greater

export const MOVE_COST_PER_MASS_TRY = 0.2;
export const MOVE_COST_PER_MASS_DO = 0.6;
export const MOVE_MULTIPLE_MASS_AT_BIRTH = 2;    // 2

export const ATTACK_COST_PER_MASS_TRY = 0.4;
export const ATTACK_COST_PER_MASS_DO = 0;
export const ATTACK_MULTIPLE_MASS_AT_BIRTH = 3;     // 0
export const ATTACK_MIN_PREY_MASS_FACTOR = 2;      // 0
*/
// -- selection method

export const GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS = 0.05; 

export const POPULATION_DEFAULT_SPECIES = [     // used in RandomFixedGenePopulation
  //{name: "Basic random move", genome: [-2088452096]},
  {name: "Plant-repro and photo", genome: [-2071543808,-2071486464]}
]

// -- objects

export const colors = {
  reproduction: "rgba(0,0,255,0.1)",
  obstacle: "rgb(60, 60, 60)",
  healing: "rgba(0,255,0, 0.1)",
  danger: "rgba(255,0,0, 0.1)",
  spawn: "rgba(255, 255, 0, 0.1)",

};



export const SIM_CODE_LENGTH = 3;


  // grid
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

  waterData : {
    waterFirstRainPerCell: 50,              // 10
    waterCellCapacity: 100,     // 20
    waterRainMaxPerCell:  30,             // 2
    waterTotalPerCell: 130,       // 
    waterEvaporationPerCellPerGeneration: 10,  // 0
    rainType : "rainTypeUniform",
  },

  // model values
  MASS_METABOLISM_GENES : [-2071543808,-2071486464], // random-2->photosynthesis, random-1->reproduction
  MASS_WATER_TO_MASS_PER_STEP : 0.30, //0.1 - 0.4
  MASS_AT_BIRTH_PLANT : 1,
  MASS_AT_BIRTH_MOVE : 2,
  MASS_AT_BIRTH_ATTACK : 2,
  MASS_AT_BIRTH_ATTACK_AND_MOVE : 3,
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
  initialGenomeSize: 4,         // 4
  maxGenomeSize: 4,
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
    //   "MoveNorth",        // 0
    //   "MoveSouth",        // 1
    //   "MoveEast",         // 2
    //   "MoveWest",         // 3
    //   "RandomMove",       // 4
    //   "MoveForward",      // 5
       "Photosynthesis",   // 6 
       "Reproduction",     // 7
    //   "Attack",           // 8
     ],
  metabolismEnabled: true,    // if false creature mass won't change
  phenotypeColorMode: "trophicLevel",    // "genome", "trophicLevel",
  // state values 
  lastCreatureIdCreated: 0,
  lastCreatureCount: 0,
  lastSurvivorsCount: 0,
  lastFitnessMaxValue: 0,
  lastSurvivalRate: 0
}


