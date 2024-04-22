
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

// -- log 
export const DEBUG_CREATURE_ID : number = 1;   // if -1, no debug, if 0 all creatures, if -10 ids from 0 to 10, if -30 ids from 0 to 30, else else a id 
export const EVENTLOGGER_LOG_THRESHOLD_DEFAULT = 1000; // lines to store before saving to disk
export const EVENTLOGGER_LOG_MAX_EVENTS = 10000; // will stop logging at this point
export const LOCALE_STRING = 'es-ES';
// -- speed controls
export const PAUSE_BETWEEN_STEPS = 10;  // [0 | 10 | 50 | 200]
export const IMMEDIATE_STEPS = 1;       // [0 | 20 | 200]
export const PAUSE_BETWEEN_GENERATIONS = 0; // [0 | 1000 | 4000]

// -- generations
export const RUN_INITIAL_POPULATION = 500; //500;
export const RUN_STEPS_PER_GENERATION = 300;


// -- environment parameters  
export const RUN_WORLD_SIZE = 100;
export const WATER_GRIDPOINT_DEFAULT = 1;
export const ENERGY_GRIDPOINT_DEFAULT = 0.01;
export const TEMP_ENERGY_CELL_CREATURE = 0.01;
export const TEMP_WATER_CELL_CREATURE = 1;

// -- metabolism 
export const METABOLISM_ENABLED = true;    // if true Creatures will run mass.step to activate metabolism
export const METABOLISM_GENES = [-2071543808,-2071486464]; // random-2->photosynthesis, random-1->reproduction
export const WATER_TO_MASS_PER_STEP = 0.35; //0.1 - 0.4
export const MASS_AT_BIRTH_GENERATION_0 = 1;
export const MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE = 0.07;   // 0.07
export const REPRODUCTION_COST_PER_MASS_TRY = 0;
export const REPRODUCTION_COST_PER_MASS_DO = 0.85;

// -- selection method

export const GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS = 0.05; 
export const RUN_SELECTION_METHOD : SelectionMethod = new InsideReproductionAreaSelection();
//export const RUN_SELECTION_METHOD : SelectionMethod = new ReproductionSelection();


// -- population strategy -- 

//export const RUN_POPULATION_STRATEGY : RandomFixedGenePopulation = new RandomFixedGenePopulation();
export const RUN_POPULATION_STRATEGY : PopulationStrategy = new AsexualZonePopulation();
//export const RUN_POPULATION_STRATEGY : PopulationStrategy = new AsexualRandomPopulation();

export const POPULATION_DEFAULT_SPECIES = [     // to be used in RandomFixedGenePopulation
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
  ];
export const RUN_ENABLED_ACTIONS : ActionName[] = [
      "MoveNorth",        // 0
      "MoveSouth",        // 1
      "MoveEast",         // 2
      "MoveWest",         // 3
      "RandomMove",       // 4
      "MoveForward",      // 5
      "Photosynthesis",   // 6 
      "Reproduction"      // 7
    ];



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
