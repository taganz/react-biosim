import { MutationMode } from "../creature/genome/MutationMode";
import { WorldEvents } from "../events/WorldEvents";
import { GenerationRegistry } from "./stats/GenerationRegistry";
import {Grid, GridCell, GridPosition} from "./grid/Grid"
import WorldObject from "./WorldObject";
import worldInitialValues from "./WorldInitialValues";
import WorldGenerations from "./WorldGenerations";


export default class WorldController {
  static instance?: WorldController ;

  // world initial values
  size: number = 10;
  stepsPerGen: number = 0;
  initialPopulation: number = 0;
  objects: WorldObject[] = [];   // to be set externally
  generations : WorldGenerations;
  grid: Grid;

  // status
  currentGen: number = 0;
  currentStep: number = 0;
  pauseBetweenSteps: number = 0;
  //immediateSteps: number = 1;    // number of steps to run without redrawing
  deletionRatio: number = 0.5;    // --> not used?
  mutationMode: MutationMode = MutationMode.wholeGene;
  pauseBetweenGenerations: number = 0;

  // Stats
  lastCreatureCount: number = 0;
  lastSurvivorsCount: number = 0;
  lastSurvivalRate: number = 0;
  lastGenerationDate: Date = new Date();
  lastGenerationDuration: number = 0;
  lastPauseDate: Date | undefined = new Date();
  pauseTime: number = 0;
  totalTime: number = 0;
  generationRegistry: GenerationRegistry = new GenerationRegistry(this);
  lastFitnessMaxValue : number = 0;

  events: EventTarget = new EventTarget();
  timeoutId?: number;

  
  constructor(worldInitialValues: worldInitialValues) {
    this.size = worldInitialValues.size;
    this.objects = worldInitialValues.worldObjects;
    this.grid = new Grid(this.size, this.objects);
    this.generations = new WorldGenerations(worldInitialValues, this.grid);
    this.stepsPerGen = worldInitialValues.stepsPerGen;
  }

  public startRun(worldInitialValues?: worldInitialValues ): void {
    if (worldInitialValues) {
      this.size = worldInitialValues.size;
      this.objects = worldInitialValues.worldObjects;
      this.grid = new Grid(this.size, this.objects);
      this.generations = new WorldGenerations(worldInitialValues, this.grid);
      this.stepsPerGen = worldInitialValues.stepsPerGen;
    }

    
    // run values
    this.currentGen = 0;
    this.currentStep = 0;
    this.totalTime = 0;

    // Stats
    this.lastSurvivorsCount = 0;
    this.lastSurvivalRate = 0;
    this.lastGenerationDuration = 0;
    this.totalTime = 0;
    this.generationRegistry = new GenerationRegistry(this);

  
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.initializeWorld, { detail: { worldController: this } })
    );

    this.computeStep();
  
  }

  private async computeStep(): Promise<void> {
          
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.startStep, { detail: { worldController: this } })
    );

    // Compute step of every creature
    const stepSurvivors : number = this.generations.step();
    
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.endStep, { detail: { worldController: this } })
    );

    // RD if everybody is dead, wait and restart
    if (stepSurvivors == 0) {
      console.log("All creatures dead. Restarting at step ",this.currentStep )
      // Small pause
      await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
      this.startRun();
      return;
    }
  
    this.currentStep++;

    if (this.currentStep > this.stepsPerGen) {
      this.endGeneration();
      this.currentStep = 0;
      this.currentGen++;
      await this.startGeneration();
    }


    this.timeoutId = window.setTimeout(
      this.computeStep.bind(this),
      this.pauseBetweenSteps
    );
    
  }

  private endGeneration(): void {
    this.generations.endGeneration();
  }

  private async startGeneration(): Promise<void> {
    this.lastGenerationDuration =
      new Date().getTime() - this.lastGenerationDate.getTime() - this.pauseTime;
    this.lastGenerationDate = new Date();
    this.pauseTime = 0;
    this.totalTime += this.lastGenerationDuration;
    this.lastPauseDate = undefined;
    this.generationRegistry.startGeneration();

    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.startGeneration, { detail: { worldController: this } })
    );

    // Small pause
    if (this.pauseBetweenGenerations > 0) {
      await new Promise((resolve) =>
        setTimeout(() => resolve(true), this.pauseBetweenGenerations)
      );
    }
  }

  pause(): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
      this.lastPauseDate = new Date();
    }
  }

  resume(): void {
    if (!this.timeoutId) {
      this.pauseTime += this.lastPauseDate
        ? new Date().getTime() - this.lastPauseDate.getTime()
        : 0;

      this.computeStep();
    }
  }


  get isPaused(): boolean {
    return !this.timeoutId;
  }

/*
  public relativeToWorld(x: number, y: number): number[] {
    const worldX = Math.floor(x * this.size);
    const worldY = Math.floor(y * this.size);

    return [worldX, worldY];
  }
*/

}
