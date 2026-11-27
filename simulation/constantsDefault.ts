import type { GenusProbability } from "./generations/population/selectGenusBasedOnProbability";

/*
 * The constants of a simulation (advanced options not shown in the UI), as the startup scenario uses them.
 * This module imports nothing from the engine, so world objects can read the colors without a circular import.
 */
export const CONSTANTS_DEFAULT = {

  PRETTIFY_OUTPUT_TO_COPY : true,
  PRETTIFY_OUTPUT_TO_FILE : true,

  // -- log (Simulation → Log, see SimulationLog.ts); they apply at once
  LOG_SPECIES : true,   // write the file of species
  LOG_CREATURES : false,   // write the file of creatures
  LOG_INCLUDE_DEAD : true,   // creatures: also the ones that died
  LOG_EVERY_N_STEPS : 0,   // a recording also writes every this many steps; 0 only at the end of each generation
  LOG_CREATURE_GENOME : false,   // creatures: add the genome of each one
  LOG_SPECIES_CREATURE_LIST : false,   // species: add the keys of their living creatures
  LOG_LOCALE_STRING : 'es-ES',   // locale of the numbers (decimal separator)
  LOG_MAX_ROWS : 1000000,   // a recording stops at this many rows
  GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS : 0.05,
  GREATEST_MASS_SELECTION_TOP_SURVIVORS : 0.05,

  // -- population strategy
  POPULATION_DEFAULT_SPECIES : [] as { name: string, genome: number[] }[],   // not used by any strategy
  POPULATION_DEFAULT_GENUS : [] as GenusProbability[],   // used in RandomFixedGenePopulation, see DEFAULT_GENUS_PROBABILITIES

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

// genus list given to POPULATION_DEFAULT_GENUS when Random Fixed Genera is chosen with an empty one,
// and to older files that lack it in the headless runner
export const DEFAULT_GENUS_PROBABILITIES : GenusProbability[] = [
  {genus: "plant", probability: 0.7},
  {genus: "attack_plant", probability: 0.3},
];
