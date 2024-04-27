export enum LogEvent {
    // creature
    REPRODUCE = "REPRODUCE",
    REPRODUCE_KO = "REPRODUCE_KO",
    PHOTOSYNTHESIS = "PHOTOSYNTHESIS",
    BIRTH = "BIRTH",
    DEAD = "DEAD",
    DEAD_ATTACKED = "DEAD_ATTACKED",
    ATTACK = "ATTACK",
    METABOLISM = "METABOLISM",
    // controller
    GENERATION_START = "GENERATION_START",
    GENERATION_END = "GENERATION_END",
    STEP_END = "STEP_END"
  }
  
  // un mapped type
export type AllowedLogEvents = {
    [key in LogEvent]: boolean;
};

export enum LogLevel {
  CREATURE = "CREATURE",
  STEP = "STEP TOTALS",
  GENERATION = "GENERATION TOTALS",
  WORLD = "WORLD EVENTS",
}



