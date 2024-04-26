export enum LogEvent {
    REPRODUCE = "REPRODUCE",
    REPRODUCE_KO = "REPRODUCE_KO",
    PHOTOSYNTHESIS = "PHOTOSYNTHESIS",
    BIRTH = "BIRTH",
    DEAD = "DEAD",
    ATTACK = "ATTACK",
    METABOLISM = "METABOLISM",
    GENERATION_START = "GENERATION_START",
    GENERATION_END = "GENERATION_END",
    STEP_END = "STEP_END"
  }
  
  // un mapped type
export type AllowedLogEvents = {
    [key in LogEvent]: boolean;
};

export enum LogClasses {
  CREATURE = "CREATURE",
  GENERATIONS = "GENERATIONS",
  WORLD_CONTROLLER = "WORLD"
}

export type AllowedLogClasses = {
  [key in LogClasses]: boolean;
};

