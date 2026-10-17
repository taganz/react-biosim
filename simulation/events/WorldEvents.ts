export enum WorldEvents {
  initializeWorld = "initializeWorld",
  startGeneration = "startGeneration",
  startStep = "startStep",
  redraw = "redraw",
  endStep = "endStep",
  // a generation finished: its stats are in the registry and the next generation is populated
  endGeneration = "endGeneration",
  // run/log state changed outside the simulation loop (pause, resume, log controls)
  stateChange = "stateChange",
  // the creature of WorldController.watchedCreatureId was born and the run paused; detail.creature is it
  watchedCreatureBorn = "watchedCreatureBorn"
}
