import { MutationMode } from "../creature/genome/MutationMode";
import { WorldEvents } from "../events/WorldEvents";
import { GenerationRegistry } from "./stats/GenerationRegistry";
import {Grid, GridCell, GridPosition} from "./grid/Grid"
import WorldObject from "./objects/WorldObject";
import worldInitialValues from "./WorldInitialValues";
import WorldGenerations from "./WorldGenerations";

// Manages generation-step loop
// ImmediateSteps for canvas redraw 
// Extintion detection and restart
// Pause/resume
export default class WorldController {
  static instance?: WorldController ;

  generations : WorldGenerations;
  grid: Grid;

  // --- world initial values ---
  size: number = 10;
  // selectionMethod in generations
  // populationStrategy in generations
  stepsPerGen: number = 0;
  initialPopulation: number = 0;
  // initialGenomeSize in generations
  // maxGenomeSize in generations
  // maxNumberNeurons in generations
  mutationMode: MutationMode = MutationMode.wholeGene;
  // mutationProbability in generations
  // geneInsertionDeletionProbability in generations
  // enabledSensors in generations
  // enabledActions in generations
  objects: WorldObject[] = [];   // to be set externally

  // --- run values ---

  // status
  currentGen: number = 0;
  currentStep: number = 0;
  deletionRatio: number = 0.5;    // --> not used?
  // speed controls
  pauseBetweenSteps: number = 0;
  immediateSteps: number = 1;    // number of steps to run without redrawing
  pauseBetweenGenerations: number = 0;
  // lastGenerationIdCreated in generations
  _immediateStepsCounter : number = 1;
  
  // Stats
  //lastCreatureCount in generations
  //lastSurvivorsCount in generations
  lastSurvivalRate: number = 0;   // used
  _lastGenerationDate: Date = new Date();
  lastGenerationDuration: number = 0; 
  _lastPauseDate: Date | undefined = new Date();
  _pauseTime: number = 0;
  totalTime: number = 0;
  
  generationRegistry: GenerationRegistry = new GenerationRegistry(this);
  
  //lastFitnessMaxValue : number = 0;

  events: EventTarget = new EventTarget();
  _timeoutId?: number;

  
  constructor(worldInitialValues: worldInitialValues) {
    this.copyWorldInitialValues(worldInitialValues);
    this.grid = new Grid(this.size, this.objects);
    this.generations = new WorldGenerations(worldInitialValues, this.grid);
    console.log("*** worldControlled constructor ***");
  }

  public startRun(worldInitialValues?: worldInitialValues ): void {
    if (worldInitialValues) {
      this.grid = new Grid(this.size, this.objects);
      this.generations = new WorldGenerations(worldInitialValues, this.grid);
      this.copyWorldInitialValues(worldInitialValues);
    }

    
    // run values
    this.currentGen = 0;
    this.currentStep = 0;
    this.totalTime = 0;

    // speed controls
    this._immediateStepsCounter = this.immediateSteps;


    // Stats
    //this.lastSurvivorsCount = 0;
    this.lastSurvivalRate = 0;
    this.lastGenerationDuration = 0;
    this.totalTime = 0;
    this.generationRegistry = new GenerationRegistry(this);

  
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.initializeWorld, { detail: { worldController: this } })
    );

    this.computeStep();
  
  }

  public resumeRun(worldInitialValues: worldInitialValues ): void {
    this.copyWorldInitialValues(worldInitialValues);
    this.grid = new Grid(this.size, this.objects);
    this.generations = new WorldGenerations(worldInitialValues, this.grid);
    this.computeStep();
  }

  private copyWorldInitialValues(worldInitialValues: worldInitialValues) : void {
    this.size = worldInitialValues.size;
    this.objects = worldInitialValues.worldObjects;
    this.size = worldInitialValues.size;
    //this.generations.selectionMethod = worldInitialValues.selectionMethod;
    //this.generations.populationStrategy = worldInitialValues.populationStrategy;
    this.stepsPerGen = worldInitialValues.stepsPerGen;
    this.initialPopulation = worldInitialValues.initialPopulation;
    //this.generations.initialGenomeSize = worldInitialValues.initialGenomeSize;
    //this.generations.maxGenomeSize = worldInitialValues.maxGenomeSize;
    //this.generations.maxNumberNeurons = worldInitialValues.maxNumberNeurons;
    this.mutationMode = worldInitialValues.mutationMode;
    //this.generations.mutationProbability = worldInitialValues.mutationProbability;
    //this.generations.geneInsertionDeletionProbability = worldInitialValues.geneInsertionDeletionProbability;
    //this.generations.sensors = worldInitialValues.enabledSensors;
    //this.generations.actions = worldInitialValues.enabledActions;
    this.objects = worldInitialValues.worldObjects;

  }

  private async computeStep(): Promise<void> {
          
    //console.log("gen.step: ", this.currentGen, ".", this.currentStep);

    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.startStep, { detail: { worldController: this } })
    );

    // Compute step of every creature
    const numberOfSurvivorsThisStep : number = this.generations.step();
    
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.endStep, { detail: { worldController: this } })
    );

    this.sendRedrawEventEveryImmediateSteps();
    
    // RD if everybody is dead, wait and restart
    if (numberOfSurvivorsThisStep == 0) {
      console.log("All creatures dead. Restarting at step ",this.currentStep )
      // Small pause
      await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
      this.startRun();
      return;
    }

    
    this.currentStep++;

    if (this.currentStep > this.stepsPerGen) {
      await this.endGeneration();
      this.currentStep = 0;
      this.startGeneration();
    }

    // loop after pause
    this._timeoutId = window.setTimeout(
        this.computeStep.bind(this),
        this.pauseBetweenSteps
      );
      
  }

  private async endGeneration(): Promise<void> {
    // Small pause
    if (this.pauseBetweenGenerations > 0) {
      await new Promise((resolve) =>
        setTimeout(() => resolve(true), this.pauseBetweenGenerations)
      );
    }
    //this._immediateStepsCounter = this.immediateSteps;
    this.generations.endGeneration();
    this.generationRegistry.startGeneration();

  }

  //private async startGeneration(): Promise<void> {
  private startGeneration() : void {
    this.currentGen++;
    this.lastGenerationDuration =
      new Date().getTime() - this._lastGenerationDate.getTime() - this._pauseTime;
    this._lastGenerationDate = new Date();
    this._pauseTime = 0;
    this.totalTime += this.lastGenerationDuration;
    this._lastPauseDate = undefined;
    
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.startGeneration, { detail: { worldController: this } })
    );


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
        console.log("redraw!", this.currentStep, "this.immediateSteps: ", this.immediateSteps);
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


  get isPaused(): boolean {
    return !this._timeoutId;
  }



}
