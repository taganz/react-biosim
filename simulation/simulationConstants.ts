
import { SensorName } from "@/simulation/creature/sensors/CreatureSensors";
import { ActionName } from "@/simulation/creature/actions/CreatureActions";
import SelectionMethod from "@/simulation/creature/selection/SelectionMethod";
import InsideReproductionAreaSelection from "@/simulation/creature/selection/InsideReproductionAreaSelection";
import PopulationStrategy from "@/simulation/creature/population/PopulationStrategy";
import AsexualZonePopulation from "@/simulation/creature/population/AsexualZonePopulation";
import AsexualRandomPopulation from "@/simulation/creature/population/AsexualRandomPopulation";
import ReproductionSelection from "@/simulation/creature/selection/ReproductionSelection";
import { MutationMode } from "@/simulation/creature/genome/MutationMode";
import RectangleReproductionArea from "@/simulation/world/areas/reproduction/RectangleReproductionArea";
import RectangleSpawnArea from "@/simulation/world/areas/spawn/RectangleSpawnArea";
import WorldObject from "@/simulation/world/objects/WorldObject";
import RectangleObject from "@/simulation/world/objects/RectangleObject";

// log
export const DEBUG_CREATURE_ID : number = 1;   // if -1, no debug, if 0 all creatures, else a id 

// environment parameters
export const WATER_GRIDPOINT_DEFAULT = 1;
export const ENERGY_GRIDPOINT_DEFAULT = 0.01;

// metabolism
export const WATER_TO_MASS_PER_STEP = 0.5; //0.1;
// --> to do future: mass loss depends on creature complexity - genome size
export const MASS_LOSS_PER_STEP = 0; // 0.05


export const CREATURE_MASS_GENERATION_0 = 1;

// --> to be calculated from the creature's grid real value
export const TEMP_ENERGY_CELL_CREATURE = 0.01;
export const TEMP_WATER_CELL_CREATURE = 1;

export const GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS = 0.05; 
export const RUN_SELECTION_METHOD : SelectionMethod = new InsideReproductionAreaSelection();
//export const RUN_SELECTION_METHOD : SelectionMethod = new ReproductionSelection();


//export const RUN_POPULATION_STRATEGY : PopulationStrategy = new AsexualZonePopulation();
export const RUN_POPULATION_STRATEGY : PopulationStrategy = new AsexualRandomPopulation();


export const RUN_MUTATION_MODE : MutationMode = MutationMode.wholeGene;

export const colors = {
    reproduction: "rgba(0,0,255,0.1)",
    obstacle: "rgb(60, 60, 60)",
    healing: "rgba(0,255,0, 0.1)",
    danger: "rgba(255,0,0, 0.1)",
    spawn: "rgba(255, 255, 0, 0.1)",
  
  };
  
// run parameters
export const RUN_WORLD_SIZE = 100;
export const RUN_STEPS_PER_GENERATION = 300;
export const RUN_INITIAL_POPULATION = 500; //500;
export const RUN_INITIAL_GENOME_SIZE = 4;
export const RUN_MAX_GENOME_SIZE = 30;
export const RUN_MAX_NUMBER_NEURONS = 15;
export const RUN_MUTATION_PROBABILITY = 0.05;
export const RUN_DELETION_RATIO = 0.5;
export const RUN_GENE_INSERTION_DELETION_PROBABILITY = 0.015;
export const RUN_ENABLED_SENSORS : SensorName[]= [
    "HorizontalPosition",
    "VerticalPosition",
    "Age",
    "Oscillator",
    "Random",
    "HorizontalSpeed",
    "VerticalSpeed",
    "HorizontalBorderDistance",
    "VerticalBorderDistance",
    "BorderDistance",
    "Mass"
  ];
export const RUN_ENABLED_ACTIONS : ActionName[] = [
      "MoveNorth",
      "MoveSouth",
      "MoveEast",
      "MoveWest",
      "RandomMove",
      "MoveForward",
      "Photosynthesis",
//      "Reproduction"
    ];

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