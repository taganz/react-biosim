export enum WorldEvents {
  initializeWorld = "initializeWorld",
  startGeneration = "startGeneration",
  startStep = "startStep",
  redraw = "redraw",
  endStep = "endStep",
  // run/log state changed outside the simulation loop (pause, resume, log controls)
  stateChange = "stateChange"
}
