import { LogEvent } from "./logger/LogEvent";
import type { GenusProbability } from "./generations/population/selectGenusBasedOnProbability";

/*
 * The constants of a simulation (advanced options not shown in the UI), as the startup scenario uses them.
 * This module imports nothing from the engine, so world objects can read the colors without a circular import.
 */
export const CONSTANTS_DEFAULT = {

  PRETTIFY_OUTPUT_TO_COPY : true,
  PRETTIFY_OUTPUT_TO_FILE : true,

  // -- log
  LOG_ENABLED : false,  // main switch for logging
  LOG_CREATURE_ID : -1,   // -1 no creatures (only the totals), 0 all creatures, -10 ids 1 to 9, -30 ids 1 to 29, else that id
  LOG_STEP_TOTALS : false,   // write the step totals
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
  {genus: "attack_animal", probability: 0},
];
