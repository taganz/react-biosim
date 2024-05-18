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
import {SIM_CODE_LENGTH} from "@/simulation/simulationConstants"
import WorldWater from "../water/WorldWater";


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
  currentGen: number = 0;
  currentStep: number = 1;
  lastGenerationDuration: number = 0; 
  totalTime: number = 0;
  

  events: EventTarget = new EventTarget();
  _immediateStepsCounter : number = 1;
  _lastGenerationDate: Date = new Date();
  _lastPauseDate: Date | undefined = new Date();
  _pauseTime: number = 0;
  _timeoutId?: number;
  _loadedWorldControllerData: WorldControllerData;
  _loadedWorldGenerationData: WorldGenerationsData;
  
  constructor(worldControllerData: WorldControllerData, worldGenerationsData: WorldGenerationsData) {
    this.loadWorldControllerInitialAndUserData(worldControllerData);
    this.grid = new Grid(this.size, this.objects, worldControllerData.waterData.waterCellCapacity);
    this.generations = new WorldGenerations(this, worldGenerationsData, this.grid);
    this.eventLogger = new EventLogger(this);
    this.worldWater = new WorldWater(this.size, worldControllerData.waterData);   // TO DO should deal with this in startRun and resumeRun
    this.worldWater.firstRain(this.grid);
    // request worldCanvas initialization 
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.initializeWorld, { detail: { worldController: this } })
    );
    this._loadedWorldControllerData = worldControllerData;
    this._loadedWorldGenerationData = worldGenerationsData;
  
    //console.log("*** worldController initialized ***");
  }

  public startRun(worldControllerData: WorldControllerData, worldGenerationsData: WorldGenerationsData ): string {

    this.loadWorldControllerInitialAndUserData(worldControllerData);
    this.simCode = generateRandomString(SIM_CODE_LENGTH),
    this.grid = new Grid(this.size, this.objects, worldControllerData.waterData.waterCellCapacity);
    this.worldWater = new WorldWater(this.size, worldControllerData.waterData);   // TO DO should deal with this in startRun and resumeRun
    this.worldWater.firstRain(this.grid);
    this.generations = new WorldGenerations(this, worldGenerationsData, this.grid);
    this.generationRegistry = new GenerationRegistry(this);
    this.eventLogger.reset();
    this.initialPopulation = worldGenerationsData.initialPopulation;
     
    // state data
    this.currentGen = 0;
    this.currentStep = 1;
    this.lastGenerationDuration = 0;
    this.totalTime = 0;
  
    this._loadedWorldControllerData = worldControllerData;
    this._loadedWorldGenerationData = worldGenerationsData;
  
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.initializeWorld, { detail: { worldController: this } })
    );

    this.generations.startFirstGeneration();
    this.computeStep();

    return this.simCode;
  
  }

  // load a previous simulation and run from its state
  public resumeRun(worldControllerData: WorldControllerData, worldGenerationsData: WorldGenerationsData, species: Creature[], stats: GenerationRegistry ): void {
    
    this.loadWorldControllerInitialAndUserData(worldControllerData);
    this.grid = new Grid(this.size, this.objects, worldControllerData.waterData.waterCellCapacity);  
    this.worldWater = new WorldWater(this.size, worldControllerData.waterData);   // TO DO should deal with this in startRun and resumeRun
    this.worldWater.firstRain(this.grid);
    // some creatures could be now at an occupied position in the new map
    const reviewedSpecies : Creature[] = [];
    for (let i = 0; i < species.length; i++) {
      const added = this.grid.addCreature(species[i]);
      if (added) {
        reviewedSpecies.push(species[i]);
      }
    }
    this.generations = new WorldGenerations(this, worldGenerationsData, this.grid, reviewedSpecies);
    this.generationRegistry = stats;
    this.eventLogger.reset();
    this.initialPopulation = worldGenerationsData.initialPopulation;


    // state data
    this.simCode = worldControllerData.simCode;
    this.currentGen = worldControllerData.currentGen;
    this.currentStep = worldControllerData.currentStep;
    this.lastGenerationDuration = worldControllerData.lastGenerationDuration;
    this.totalTime = worldControllerData.totalTime;

    this._loadedWorldControllerData = worldControllerData;
    this._loadedWorldGenerationData = worldGenerationsData;
  
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.initializeWorld, { detail: { worldController: this } })
    );
    
    this.computeStep();
  }

  private loadWorldControllerInitialAndUserData(worldControllerData: WorldControllerData) : void {
    // --> load only worldController values. worldGeneration will load others

    // initial values
    this.size = worldControllerData.size;
    this.stepsPerGen = worldControllerData.stepsPerGen;
    if (worldControllerData.worldObjects) {
      this.objects = [...worldControllerData.worldObjects];   
    }
    //this.waterFirstRainPerCell = worldControllerData.waterFirstRainPerCell;
    //this.waterCellCapacity = worldControllerData.waterCellCapacity;

    this.pauseBetweenSteps = worldControllerData.pauseBetweenSteps;
    this.immediateSteps = worldControllerData.immediateSteps;
    this.pauseBetweenGenerations = worldControllerData.pauseBetweenGenerations;

  }

  private async computeStep(): Promise<void> {
          
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.startStep, { detail: { worldController: this } })
    );

    // Compute step of every creature
    const numberOfSurvivorsThisStep : number = this.generations.step();
    
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.endStep, { detail: { worldController: this } })
    );

    this.log(LogEvent.STEP_END, "population", this.generations.currentCreatures.length);
    this.log(LogEvent.STEP_END, "waterInCells", this.worldWater.waterInCells);
    this.log(LogEvent.STEP_END, "waterInCloud", this.worldWater.waterInCloud);
    this.log(LogEvent.STEP_END, "waterInCreatures", this.worldWater.waterInCreatures);
    this.log(LogEvent.STEP_END, "waterTotal", 
            this.worldWater.waterInCells 
            + this.worldWater.waterInCloud 
            + this.worldWater.waterInCreatures);
    
    this.sendRedrawEventEveryImmediateSteps();
    
    // RD if everybody is dead, wait and restart
    if (numberOfSurvivorsThisStep == 0) {
      console.log("All creatures dead. Restarting at step ",this.currentStep )
      // Small pause
      await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
      this.startRun(this._loadedWorldControllerData, this._loadedWorldGenerationData);
      return;
    }

    
    
    if (this.currentStep == this.stepsPerGen) {
      await this.endGeneration();
      this.startGeneration();
    } else {
      this.currentStep++;
    }

    // loop after pause
    this._timeoutId = window.setTimeout(
        this.computeStep.bind(this),
        this.pauseBetweenSteps
      );
      
  }


  //private async startGeneration(): Promise<void> {
  private startGeneration() : void {
    this.lastGenerationDuration = new Date().getTime() - this._lastGenerationDate.getTime() - this._pauseTime;
    this._lastGenerationDate = new Date();
    this._pauseTime = 0;
    this.totalTime += this.lastGenerationDuration;
    this._lastPauseDate = undefined;

    this.currentStep = 1;
    this.currentGen++;
    
    this.generations.endGeneration();
    this.worldWater.rain(this.grid);
    this.generationRegistry.startGeneration();

    this.log(LogEvent.GENERATION_START, "population", this.generations.currentCreatures.length);
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.startGeneration, { detail: { worldController: this } })
    );


  }

  
  private async endGeneration(): Promise<void> {
    this.log(LogEvent.GENERATION_END, "population", this.generations.currentCreatures.length);
    this.worldWater.evaporation(this.grid);
    this.log(LogEvent.GENERATION_END, "waterInCells", this.worldWater.waterInCells);
    this.log(LogEvent.GENERATION_END, "waterInCloud", this.worldWater.waterInCloud);
    this.log(LogEvent.GENERATION_END, "waterInCreatures", this.worldWater.waterInCreatures);
    this.log(LogEvent.GENERATION_END, "waterTotal", 
            this.worldWater.waterInCells 
            + this.worldWater.waterInCloud 
            + this.worldWater.waterInCreatures);
    
    // Small pause
    if (this.pauseBetweenGenerations > 0) {
      await new Promise((resolve) =>
        setTimeout(() => resolve(true), this.pauseBetweenGenerations)
      );
    }
    //this._immediateStepsCounter = this.immediateSteps;

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
    if (this._timeoutId) {
      window.clearTimeout(this._timeoutId);
      this._timeoutId = undefined;
      this._lastPauseDate = new Date();
    }
  }

  resume(): void {
    if (!this._timeoutId) {
      this._pauseTime += this._lastPauseDate
        ? new Date().getTime() - this._lastPauseDate.getTime()
        : 0;

      this.computeStep();
    }
  }

  get eventLoggerIsPaused() : boolean {
    return this.eventLogger.isPaused;
  }
  pauseLog() : void {
    this.eventLogger.pause();
  }
  resumeLog() : void {
    this.eventLogger.resume();
  }

  get isPaused(): boolean {
    return !this._timeoutId;
  }


  private log(eventType: LogEvent, paramName? : string, paramValue? : number | string) { 
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
      paramValue: paramValue ?? "",
    }
    this.eventLogger.logEvent(event);
  }
}
