
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
import {PhenoTypeColorMode} from "@/simulation/SimulationTypes";


// -- log 
export const LOG_ENABLED : boolean = true;  // main switch for logging
export const LOG_PAUSED_AT_START : boolean = true;   // true to reduce load if not needed
export const LOG_LEVEL : LogLevel = LogLevel.CREATURE; 
export const LOG_CREATURE_ID : number = -10;   // if 0 all creatures, if -10 ids from 0 to 10, if -30 ids from 0 to 30, else else a id 
export const LOG_EVENTLOGGER_MAX_EVENTS = 100000; // will stop logging at this point
export const LOG_LOCALE_STRING = 'es-ES';
export const LOG_ALLOWED_EVENTS: AllowedLogEvents = {
  // creature
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
//TODO falta implementar aixo --> export const WORLDCONTROLLER_PAUSED_AT_START : boolean = true;  // false to sstart running simulation when app loads


// -- speed controls
export const PAUSE_BETWEEN_STEPS = 10;  // [0 | 10 | 50 | 200]
export const IMMEDIATE_STEPS = 1;       // [0 | 20 | 200]
export const PAUSE_BETWEEN_GENERATIONS = 0; // [0 | 1000 | 4000]

// -- generations
export const RUN_INITIAL_POPULATION = 5; //500;
export const RUN_STEPS_PER_GENERATION = 3; // 300;


// -- environment parameters  
export const RUN_WORLD_SIZE = 100;
export const GRIDPOINT_WATER_DEFAULT = 10;
export const GRIDPOINT_WATER_CAPACITY_DEFAULT = 20;
export const RAIN_MAX_VALUE = 2;

// -- metabolism 
export const MASS_METABOLISM_ENABLED = false;    // if false creature mass won't change
export const MASS_METABOLISM_GENES = [-2071543808,-2071486464]; // random-2->photosynthesis, random-1->reproduction
export const MASS_WATER_TO_MASS_PER_STEP = 0.30; //0.1 - 0.4
export const MASS_AT_BIRTH_PLANT = 1;
export const MASS_AT_BIRTH_MOVE = 2;
export const MASS_AT_BIRTH_ATTACK = 2;
export const MASS_AT_BIRTH_ATTACK_AND_MOVE = 3;
export const MASS_MAX_MULTIPLE_MASS_AT_BIRT = 10;

export const MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE = 0.05;   // 0.07

export const REPRODUCTION_COST_PER_MASS_TRY = 0.1;    
export const REPRODUCTION_COST_PER_MASS_DO = 0;
export const REPRODUCTION_MULTIPLE_MASS_AT_BIRTH = 3;    

export const MOVE_COST_PER_MASS_TRY = 0.2;
export const MOVE_COST_PER_MASS_DO = 0.3;
export const MOVE_MULTIPLE_MASS_AT_BIRTH = 2;

export const ATTACK_COST_PER_MASS_TRY = 0.3;
export const ATTACK_COST_PER_MASS_DO = 0;
export const ATTACK_MULTIPLE_MASS_AT_BIRTH = 0;
export const ATTACK_MIN_PREY_MASS_FACTOR = 0;

// -- selection method

export const GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS = 0.05; 
export const RUN_SELECTION_METHOD : SelectionMethod = new InsideReproductionAreaSelection();
//export const RUN_SELECTION_METHOD : SelectionMethod = new ReproductionSelection();


// -- population strategy -- 

//export const RUN_POPULATION_STRATEGY : RandomFixedGenePopulation = new RandomFixedGenePopulation();
//export const RUN_POPULATION_STRATEGY : PopulationStrategy = new AsexualZonePopulation();
export const RUN_POPULATION_STRATEGY : PopulationStrategy = new AsexualRandomPopulation();

export const POPULATION_DEFAULT_SPECIES = [     // used in RandomFixedGenePopulation
  //{name: "Basic random move", genome: [-2088452096]},
  {name: "Plant-repro and photo", genome: [-2071543808,-2071486464]}
]
 

// -- brain
export const RUN_MUTATION_MODE : MutationMode = MutationMode.wholeGene;
export const RUN_INITIAL_GENOME_SIZE = 4;
export const RUN_MAX_GENOME_SIZE = 30;
export const RUN_MAX_NUMBER_NEURONS = 15;
export const RUN_MUTATION_PROBABILITY = 0.05;
export const RUN_DELETION_RATIO = 0.5;
export const RUN_GENE_INSERTION_DELETION_PROBABILITY = 0.015;
export const RUN_ENABLED_SENSORS : SensorName[]= [
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
    "Mass",                     // 10
 //   "Touch",                  // 11
  ];
export const RUN_ENABLED_ACTIONS : ActionName[] = [
      "MoveNorth",        // 0
      "MoveSouth",        // 1
      "MoveEast",         // 2
      "MoveWest",         // 3
      "RandomMove",       // 4
      "MoveForward",      // 5
      "Photosynthesis",   // 6 
      "Reproduction",     // 7
      "Attack",           // 8
    ];


// -- phenotype
export const PHENOTYPE_COLOR_MODE : PhenoTypeColorMode  = "genome";    // "genome", "trophicLevel"

// -- objects

export const colors = {
  reproduction: "rgba(0,0,255,0.1)",
  obstacle: "rgb(60, 60, 60)",
  healing: "rgba(0,255,0, 0.1)",
  danger: "rgba(255,0,0, 0.1)",
  spawn: "rgba(255, 255, 0, 0.1)",

};

export const RUN_WORLD_OBJECTS : WorldObject[] = [
  // A spawn zone at top left
  new RectangleSpawnArea(0.1, 0.1, 0.2, 0.2, true),
  // A reproduction zone at  center
  new RectangleReproductionArea(0.3, 0.6, 0.2, 0.4, true),
  // A map divided at bottom by 5 columns
  new RectangleObject(0.1, 0.6, 0.04, 0.4),
  new RectangleObject(0.3, 0.6, 0.04, 0.4),
  new RectangleObject(0.5, 0.6, 0.04, 0.4),
  new RectangleObject(0.7, 0.6, 0.04, 0.4),
  new RectangleObject(0.9, 0.6, 0.04, 0.4),
];

export const SIM_CODE_LENGTH = 3;