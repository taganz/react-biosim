import { MutationMode } from "../creature/brain/MutationMode";
import { WorldEvents } from "../events/WorldEvents";
import { GenerationRegistry } from "./stats/GenerationRegistry";
import {Grid, GridCell, GridPosition} from "./grid/Grid"
import WorldObject from "./objects/WorldObject";
import WorldControllerData from "./WorldControllerData";
import WorldGenerations from "../generations/WorldGenerations";
import WorldGenerationsData from "../generations/WorldGenerationsData";
import Creature from "../creature/Creature"
import EventLogger, {SimulationCallEvent} from '@/simulation/logger/EventLogger';
import {LogEvent, LogLevel} from '@/simulation/logger/LogEvent';
import generateRandomString from "@/helpers/generateRandomString";
import WorldWater from "../water/WorldWater";
import { SimulationData } from "../SimulationData";

// max time (ms) spent computing steps before yielding to the browser
const MAX_TICK_MS = 30;


// Manages generation-step loop
// ImmediateSteps for canvas redraw 
// Extintion detection and restart
// Pause/resume
// Logger
export default class WorldController {
  static instance?: WorldController ;

  generations : WorldGenerations;
  grid: Grid;
  generationRegistry = new GenerationRegistry(this);
  eventLogger : EventLogger;
  worldWater : WorldWater;
  simData : SimulationData;

  // initial values
  simCode: string = "XXX";
  size: number = 10;
  stepsPerGen: number = 0;
  initialPopulation: number = 0;
  objects: WorldObject[] = [];   // to be set externally
  //waterFirstRainPerCell: number = 0;
  //waterCellCapacity: number = 0;
  
  // user values 
  pauseBetweenSteps: number = 0;
  immediateSteps: number = 1;    // number of steps to run without redrawing
  pauseBetweenGenerations: number = 0;
  
  // state values
  currentGen: number = 1;
  currentStep: number = 1;
  lastGenerationDuration: number = 0; 
  totalTime: number = 0;
  

  events: EventTarget = new EventTarget();
  _immediateStepsCounter : number = 1;
  _lastGenerationDate: Date = new Date();
  _lastPauseDate: Date | undefined = new Date();
  _pauseTime: number = 0;
  _timeoutId?: number;
  // incremented when the world is replaced (start/resume run), so a loop from the previous run stops
  private _runId = 0;
  private _paused = true;
  // a tick can be waiting inside an await (pause between generations, extinction restart)
  private _tickInFlight = false;

  constructor(sim: SimulationData) {
    this.simData = sim;
    this.loadWorldControllerInitialAndUserData(sim.worldControllerData);
    this.objects = sim.worldObjects;
    this.grid = new Grid(this.size, this.objects, sim.waterData.waterCellCapacity);
    this.generations = new WorldGenerations(this, sim.worldGenerationsData, this.grid);
    this.eventLogger = new EventLogger(this);
    this.worldWater = new WorldWater(this.size, sim.waterData);   // TO DO should deal with this in startRun and resumeRun
    this.worldWater.firstRain(this.grid);
    // request worldCanvas initialization 
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.initializeWorld, { detail: { worldController: this } })
    );
  
    //console.log("*** worldController initialized ***");
  }

  public startRun(sim: SimulationData): string {

    this.simData = sim;
    this.loadWorldControllerInitialAndUserData(sim.worldControllerData);
    this.objects = sim.worldObjects; 
    this.simCode = generateRandomString(sim.constants.SIM_CODE_LENGTH),
    this.grid = new Grid(this.size, this.objects, sim.waterData.waterCellCapacity);
    this.worldWater = new WorldWater(this.size, sim.waterData);   // TO DO should deal with this in startRun and resumeRun
    this.worldWater.firstRain(this.grid);
    this.generations = new WorldGenerations(this, sim.worldGenerationsData, this.grid);
    this.generationRegistry = new GenerationRegistry(this);
    this.eventLogger.reset();
    this.initialPopulation = sim.worldGenerationsData.initialPopulation;
     
    // state data
    this.currentGen = 1;
    this.currentStep = 1;
    this.lastGenerationDuration = 0;
    this.totalTime = 0;
  
  
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.initializeWorld, { detail: { worldController: this } })
    );

    this.generations.populate();
    this.startLoop();

    return this.simCode;
  
  }

  // load a previous simulation and run from its state
  public resumeRun(sim: SimulationData): void {
    
    this.simData = sim;
    this.loadWorldControllerInitialAndUserData(sim.worldControllerData);
    this.objects = sim.worldObjects; 
    this.grid = new Grid(this.size, this.objects, sim.waterData.waterCellCapacity);  
    this.worldWater = new WorldWater(this.size, sim.waterData);   // TO DO should deal with this in startRun and resumeRun
    this.worldWater.firstRain(this.grid);
    // some creatures could be now at an occupied position in the new map
    const reviewedSpecies : Creature[] = [];
    if (sim.species != undefined) {
      for (let i = 0; i < sim.species.length; i++) {
        for (let j = 0;j < sim.species[i].creatures.length; j++) {
          const added = this.grid.addCreature(sim.species[i].creatures[j]);
          if (added) {
            reviewedSpecies.push(sim.species[i].creatures[j]);
          }
        }
      }
    }
    this.generations = new WorldGenerations(this, sim.worldGenerationsData, this.grid, reviewedSpecies);
    if (sim.stats !== undefined) {
      this.generationRegistry.copyExceptWorldController(sim.stats);
    }
    this.eventLogger.reset();
    this.initialPopulation = sim.worldGenerationsData.initialPopulation;


    // state data
    this.simCode = sim.worldControllerData.simCode;
    this.currentGen = sim.worldControllerData.currentGen;
    this.currentStep = sim.worldControllerData.currentStep;
    this.lastGenerationDuration = sim.worldControllerData.lastGenerationDuration;
    this.totalTime = sim.worldControllerData.totalTime;

  
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.initializeWorld, { detail: { worldController: this } })
    );

    this.startLoop();
  }

  private loadWorldControllerInitialAndUserData(worldControllerData: WorldControllerData) : void {
    // --> load only worldController values. worldGeneration will load others

    this.size = worldControllerData.size;
    this.stepsPerGen = worldControllerData.stepsPerGen;
    this.pauseBetweenSteps = worldControllerData.pauseBetweenSteps;
    this.immediateSteps = worldControllerData.immediateSteps;
    this.pauseBetweenGenerations = worldControllerData.pauseBetweenGenerations;

  }

  // generations enters mainLoop() with currentCreatures already populated
  // Runs several steps per timer tick: browsers clamp chained setTimeout calls
  // to ~4ms, so one step per tick would cap the simulation at ~250 steps/s.
  private async mainLoop(): Promise<void> {

    const runId = this._runId;
    this._timeoutId = undefined;
    this._tickInFlight = true;

    const maxSteps = this.pauseBetweenSteps > 0 ? 1 : Math.max(1, this.immediateSteps);
    const tickStart = performance.now();
    let stepsDone = 0;

    while (!this._paused && stepsDone < maxSteps && performance.now() - tickStart < MAX_TICK_MS) {
      const result = await this.runStep(runId);
      // the world was restarted or reloaded while this step was running; the new run has its own loop
      if (runId !== this._runId) return;
      stepsDone++;
      if (result === "generationEnded") break;
    }

    this._tickInFlight = false;

    // loop after pause
    if (!this._paused) {
      this._timeoutId = window.setTimeout(
          this.mainLoop.bind(this),
          this.pauseBetweenSteps
        );
    }

  }

  // stops any loop left from the previous run and starts a new one
  private startLoop(): void {
    window.clearTimeout(this._timeoutId);
    this._timeoutId = undefined;
    this._runId++;
    this._tickInFlight = false;
    this._paused = false;
    this.mainLoop();
  }

  private async runStep(runId: number): Promise<"continue" | "generationEnded" | "restarted"> {

    if (this.currentStep === 1) {
      this.logStartGeneration();
      this.events.dispatchEvent(
        new CustomEvent(WorldEvents.startGeneration, { detail: { worldController: this } })
      );
    }

    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.startStep, { detail: { worldController: this } })
    );

    // Compute step of every creature
    const numberOfSurvivorsThisStep : number = this.generations.step();
    
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.endStep, { detail: { worldController: this } })
    );

    this.logEndStep();
    
    this.sendRedrawEventEveryImmediateSteps();
    
    // RD if everybody is dead, wait and restart
    if (numberOfSurvivorsThisStep == 0) {
      console.log("All creatures dead. Restarting at step ",this.currentStep )
      // Small pause
      await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
      // the user may have restarted or loaded another simulation during the wait
      if (runId === this._runId) {
        this.startRun(this.simData);
      }
      return "restarted";
    }


    if (this.currentStep == this.stepsPerGen) {
      await this.endGeneration(runId);
      return "generationEnded";
    }
    this.currentStep++;
    return "continue";

  }

  
  private async endGeneration(runId: number): Promise<void> {

    this.logEndGeneration();

    // Small pause
    if (this.pauseBetweenGenerations > 0) {
      await new Promise((resolve) =>
        setTimeout(() => resolve(true), this.pauseBetweenGenerations)
      );
      // don't touch the new world if it was restarted or reloaded during the pause
      if (runId !== this._runId) return;
    }
    //this._immediateStepsCounter = this.immediateSteps;

    
    this.lastGenerationDuration = new Date().getTime() - this._lastGenerationDate.getTime() - this._pauseTime;
    this._lastGenerationDate = new Date();
    this._pauseTime = 0;
    this.totalTime += this.lastGenerationDuration;
    this._lastPauseDate = undefined;

    this.currentStep = 1;
    this.currentGen++;
    
    this.generations.selectionAndRepopulate();

    if (this.generations.selectionMethod.isContinuous == false) {
      this.worldWater.reset();   
      this.worldWater.firstRain(this.grid);
    }
    this.worldWater.rain(this.grid);            //TODO rain should occur during generation
    this.generationRegistry.startGeneration();

    this.logStartGeneration();


  }

  private sendRedrawEventEveryImmediateSteps() : void { 
    if (this.immediateSteps == 1) {
      this.events.dispatchEvent(
        new CustomEvent(WorldEvents.redraw, { detail: { worldController: this } })
      );
    } else
    if (this._immediateStepsCounter > 0) {
      this._immediateStepsCounter--;
      if (this._immediateStepsCounter == 0) {
        this.events.dispatchEvent(
          new CustomEvent(WorldEvents.redraw, { detail: { worldController: this } })
        );
        this._immediateStepsCounter = this.immediateSteps;
      } 
    }
  }

  


  pause(): void {
    if (!this._paused) {
      this._paused = true;
      window.clearTimeout(this._timeoutId);
      this._timeoutId = undefined;
      this._lastPauseDate = new Date();
    }
    this.notifyStateChange();
  }

  resume(): void {
    if (this._paused) {
      this._paused = false;
      this._pauseTime += this._lastPauseDate
        ? new Date().getTime() - this._lastPauseDate.getTime()
        : 0;

      // a tick still waiting inside an await will schedule the next one itself
      if (!this._tickInFlight) {
        this.mainLoop();
      }
    }
    this.notifyStateChange();
  }

  get eventLoggerIsPaused() : boolean {
    return this.eventLogger.isPaused;
  }
  pauseLog() : void {
    this.eventLogger.pause();
    this.notifyStateChange();
  }
  resumeLog() : void {
    this.eventLogger.resume();
    this.notifyStateChange();
  }

  // lets the UI know about changes that happen while the simulation loop is not running
  notifyStateChange() : void {
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.stateChange, { detail: { worldController: this } })
    );
  }

  get isPaused(): boolean {
    return this._paused;
  }


  private logStartGeneration() {
    this.log(LogEvent.GENERATION_START, "population", this.generations.currentCreatures.length);
  }

  private logEndStep() {
    // avoid filtering the whole population every step when nothing is recorded
    if (this.eventLogger.isPaused) return;
    this.log(LogEvent.STEP_END, "population", this.generations.currentCreatures.length);
    this.log(LogEvent.STEP_END, "population_plant", this.generations.currentCreatures.filter(crea => crea.genus === "plant").length);
    this.log(LogEvent.STEP_END, "population_attack_plant", this.generations.currentCreatures.filter(crea => crea.genus === "attack_plant").length);
    this.log(LogEvent.STEP_END, "population_attack_animal", this.generations.currentCreatures.filter(crea => crea.genus === "attack_animal").length);
    this.log(LogEvent.STEP_END, "waterInCells", this.worldWater.waterInCells);
    this.log(LogEvent.STEP_END, "waterInCloud", this.worldWater.waterInCloud);
    this.log(LogEvent.STEP_END, "waterInCreatures", this.worldWater.waterInCreatures);
    this.log(LogEvent.STEP_END, "waterTotal", 
            this.worldWater.waterInCells 
            + this.worldWater.waterInCloud 
            + this.worldWater.waterInCreatures);

  }

  private logEndGeneration() {
    this.log(LogEvent.GENERATION_END, "population", this.generations.currentCreatures.length);
    this.log(LogEvent.GENERATION_END, "population_plant", this.generations.currentCreatures.filter(crea => crea.genus === "plant").length);
    this.log(LogEvent.GENERATION_END, "population_attack_plant", this.generations.currentCreatures.filter(crea => crea.genus === "attack_plant").length);
    this.log(LogEvent.GENERATION_END, "population_attack_animal", this.generations.currentCreatures.filter(crea => crea.genus === "attack_animal").length);
    this.worldWater.evaporation(this.grid);
    this.log(LogEvent.GENERATION_END, "waterInCells", this.worldWater.waterInCells);
    this.log(LogEvent.GENERATION_END, "waterInCloud", this.worldWater.waterInCloud);
    this.log(LogEvent.GENERATION_END, "waterInCreatures", this.worldWater.waterInCreatures);
    this.log(LogEvent.GENERATION_END, "waterTotal", 
            this.worldWater.waterInCells 
            + this.worldWater.waterInCloud 
            + this.worldWater.waterInCreatures);

  }

  private log(eventType: LogEvent, paramName? : string, paramValue? : number, paramValue2? : number, paramString?: string) { 
    if (!this.eventLogger) {
      console.error("this.eventLogger not found");
      return;
    }
    const event : SimulationCallEvent = {
      logLevel: LogLevel.WORLD,      
      creatureId: "",
      speciesId: "",
      genusId : "",
      eventType: eventType,
      paramName: paramName ?? "",
      paramValue: paramValue ?? 0,
      paramValue2: paramValue2 ?? 0,
      paramString : paramString ?? ""
    }
    this.eventLogger.logEvent(event);
  }
}

