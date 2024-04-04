import CreatureActions from "../creature/actions/CreatureActions";
import Creature from "../creature/Creature";
import { MutationMode } from "../creature/genome/MutationMode";
//import AsexualRandomPopulation from "../creature/population/AsexualRandomPopulation";
import AsexualZonePopulation from "../creature/population/AsexualZonePopulation";
import PopulationStrategy from "../creature/population/PopulationStrategy";
//import EastWallSelection from "../creature/selection/EastWallSelection";
import InsideReproductionAreaSelection from "../creature/selection/InsideReproductionAreaSelection";
import SelectionMethod from "../creature/selection/SelectionMethod";
import CreatureSensors from "../creature/sensors/CreatureSensors";
import { WorldEvents } from "../events/WorldEvents";
import { GenerationRegistry } from "./stats/GenerationRegistry";
import * as constants from "@/simulation/simulationConstants"
import {Grid, GridCell, GridPosition} from "./grid/Grid"
import WorldObject from "./WorldObject";
import WorldCanvas from "./WorldCanvas";
import Genome from "@/simulation/creature/genome/Genome";


export default class World {
  static instance?: World;

  canvas: HTMLCanvasElement;
  worldCanvas : WorldCanvas;

  
  // initial settings - to be set externally
  size: number = 10;
  stepsPerGen: number = 0;
  initialPopulation: number = 0;
  initialGenomeSize: number = 0;
  maxGenomeSize: number = 0;
  maxNumberNeurons: number = 0;
  mutationProbability: number = 0;
  geneInsertionDeletionProbability: number = 0;
  sensors: CreatureSensors = new CreatureSensors();
  actions: CreatureActions = new CreatureActions();

   // World
   grid: Grid = new Grid(0);
   objects: WorldObject[] = [];   // to be set externally
   currentCreatures: Creature[] = [];

   lastCreatureIdCreated : number = 0;   // --> aprofitar posicio en array per id de creatures?

  // status
  currentGen: number = 0;
  currentStep: number = 0;
  timePerStep: number = 0;
  immediateSteps: number = 1;    // number of steps to run without redrawing
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

  populationStrategy:   PopulationStrategy = new AsexualZonePopulation(); 
  
  selectionMethod: SelectionMethod = new InsideReproductionAreaSelection();  

  events: EventTarget = new EventTarget();
  timeoutId?: number;

 

  constructor(canvas: HTMLCanvasElement | null) {
    if (canvas) {
      this.canvas = canvas;
      this.worldCanvas = new WorldCanvas(this.canvas, this.size);
      window.addEventListener("resize", this.redrawWorldCanvas.bind(this));
    } else {
      throw new Error("Cannot found canvas");
    }
  }

  public initializeWorld(size: number): void {
    this.worldCanvas = new WorldCanvas(this.canvas, this.size);
    console.log("initializeWorld size ", size);
    this.size = size;
    this.grid = new Grid(size);
    this.sensors.updateInternalValues();
    this.actions.updateInternalValues();

    this.currentGen = 0;
    this.currentStep = 0;
    this.totalTime = 0;

    // Stats
    this.lastCreatureCount = 0;
    this.lastSurvivorsCount = 0;
    this.lastSurvivalRate = 0;
    this.lastGenerationDuration = 0;
    this.totalTime = 0;
    this.generationRegistry = new GenerationRegistry(this);

    // Clear previous creatures
    this.currentCreatures = [];
    this.lastCreatureIdCreated = 0;   // resets at generation
    
    this.initializeGrid();

    //this.computeGrid();
    
    // --> should take into account objects size
    if (this.initialPopulation >= this.size * this.size) {
      throw new Error(
        "The population cannot be greater than the number of available tiles in the world: ".concat(this.initialPopulation.toString(), " vs ", (this.size * this.size).toString())
      );
    }

    this.populationStrategy.populate(this);
    console.log("New population:", this.currentCreatures.length);
    console.log(`Genome size: ${this.initialGenomeSize} genes`);
    
    this.lastCreatureCount = this.currentCreatures.length;
    this.worldCanvas.redraw(this.currentCreatures, this.objects, this.currentGen);

    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.initializeWorld, { detail: { world: this } })
    );
  }


  // creates a new creature, add to currentCreatures, add to grid
  public newCreatureFirstGeneration(position : GridPosition) {
    const creature = new Creature(this, position);
    this.grid.addCreature(creature);
    this.currentCreatures.push(creature);
    this.lastCreatureIdCreated += 1;
  }

  // creates a new creature, add to currentCreatures, add to grid, mutate genome
  public newCreature(position : GridPosition, massAtBirth: number, genome: Genome) : Creature {
    const creature = new Creature(this, position, massAtBirth, genome.clone(
      true,
      this.mutationMode,
      this.maxGenomeSize,
      this.mutationProbability,
      this.geneInsertionDeletionProbability,
      this.deletionRatio
    )
    );
    this.grid.addCreature(creature);
    this.currentCreatures.push(creature);
    this.lastCreatureIdCreated += 1;
    return creature;
  }

  // --> to be moved to grid
  private initializeGrid(): void {
    // Generate pixels of objects
    for (let i = 0; i < this.objects.length; i++) {
      this.objects[i].computePixels(this.size);
    }

    for (let x = 0; x < this.size; x++) {
      // Create column
      const col: Array<GridCell> = [];
      for (let y = 0; y < this.size; y++) {
        // Create and push row
        col.push({ creature: null, objects: [], isSolid: false, water: constants.WATER_GRIDPOINT_DEFAULT, energy: constants.ENERGY_GRIDPOINT_DEFAULT });
      }

      // Push column
      this.grid.addRow(col);
    }

    // Check objects
    for (
      let objectIndex = 0;
      objectIndex < this.objects.length;
      objectIndex++
    ) {
      const obj = this.objects[objectIndex];

      for (let pixelIdx = 0; pixelIdx < obj.pixels.length; pixelIdx++) {
        const [x, y] = obj.pixels[pixelIdx];
        // Set pixel
        //this.grid[x][y].objects.push(obj);
        this.grid.cell(x, y).objects.push(obj);
        // Is it solid?
        if (obj.areaType === undefined) {
          this.grid.cell(x,y).isSolid = true;
        }
      }
    }

    // Another way of initializing the array is with map functions
    // this.grid = [...new Array(this.size)].map(() =>
    //   [...new Array(this.size)].map(() => [null, null, null])
    // );

    // This for loop is used to iterate over every pixel in the grid
    // for (let y = 0; y < this.size; y++) {
    //   for (let x = 0; x < this.size; x++) {
    //     console.log(this.grid[x][y]);
    //   }
    // }
  }

  public computeGrid() {
    console.warn("world.computeGrid is deprecated --> should investigate why is gui calling it!!")
  }
  /*
  // place creatures in the grid
  public computeGrid() {
    this.grid.clear();

    // Set creatures
    for (let i = 0; i < this.currentCreatures.length; i++) {
      const creature = this.currentCreatures[i];

      if (creature.isAlive) {
        // Set creature if it's alive
        this.grid.cell(creature.position[0], creature.position[1]).creature =
          creature;
      }
    }
    // // Use this to check if there are more than one creature in any
    // // grid point
    // let creatureAliveCount = 0;
    // for (let i = 0; i < this.currentCreatures.length; i++) {
    //   if (this.currentCreatures[i].isAlive) {
    //     creatureAliveCount++;
    //   }
    // }
    // let creaturesInGrid = 0;
    // for (let y = 0; y < this.size; y++) {
    //   for (let x = 0; x < this.size; x++) {
    //     if (this.grid[x][y].creature) {
    //       creaturesInGrid++;
    //     }
    //   }
    // }
    // if (creaturesInGrid != creatureAliveCount) {
    //   console.log(
    //     "creatureCount",
    //     creaturesInGrid,
    //     "creatureAliveCount",
    //     creatureAliveCount,
    //     this.currentCreatures.length,
    //     this.currentStep
    //   );
    // }
  }
  */

  startRun(): void {
    this.computeStep();
  }

  private async computeStep(): Promise<void> {
    if (this.currentStep === 0) {
      this.lastPauseDate = undefined;
      this.pauseTime = 0;
      this.lastGenerationDate = new Date();

      if (this.currentGen === 0) {
        this.events.dispatchEvent(
          new CustomEvent(WorldEvents.startGeneration, {
            detail: { world: this },
          })
        );
      }
    }

    for (let i = 0; i < this.immediateSteps; i++) {
      this.events.dispatchEvent(
        new CustomEvent(WorldEvents.startStep, { detail: { world: this } })
      );

      // Recompute grid - place creatures in the grid 
      //this.computeGrid();

      // Compute step of every creature
      //console.log("entering step creatures: ", this.currentCreatures.length);
      for (let i = 0; i < this.currentCreatures.length; i++) {
        const creature = this.currentCreatures[i];
        if (creature.isAlive) {
          //console.log("step creature ", creature.id);
          // Effect of the areas the creature is in
          const point = this.grid.cell(creature.position[0], creature.position[1]);
          for (
            let objectIndex = 0;
            objectIndex < point.objects.length;
            objectIndex++
          ) {
            point.objects[objectIndex].areaEffectOnCreature?.(creature);
          }

          creature.computeStep();
        }
      }
      //console.log("step ", this.currentStep );
      
      //const c = this.currentCreatures[0];
      //console.log(this.currentGen, this.currentStep, c.lastDirection, c.stepDirection, c.position[0], c.position[1], c.distancePartial, c.distanceCovered, c.stepsStopped);

      this.events.dispatchEvent(
        new CustomEvent(WorldEvents.endStep, { detail: { world: this } })
      );

      this.currentStep++;

      if (this.currentStep > this.stepsPerGen) {
        this.endGeneration();
        this.currentStep = 0;
        this.currentGen++;
        await this.startGeneration();
      }

    }

    this.worldCanvas.redraw(this.currentCreatures, this.objects, this.currentGen);


    // RD if everybody is dead, wait and restart
    let someBodyIsAlive = false;
    for (let i = 0; i < this.currentCreatures.length; i++) {  // --> aixo es podria calcular al bucle adalt
      someBodyIsAlive = this.currentCreatures[i].isAlive;
      if (someBodyIsAlive) {
        break;
      }
    }
    if (someBodyIsAlive == false) {
      console.log("All creatures dead. Restarting at step ",this.currentStep )
      // Small pause
      await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
      this.initializeWorld(this.size);
      this.resume();
      return;
    }
  
    this.timeoutId = window.setTimeout(
      this.computeStep.bind(this),
      this.timePerStep
    );
    
  }

  private endGeneration(): void {}

  private async startGeneration(): Promise<void> {
    this.lastGenerationDuration =
      new Date().getTime() - this.lastGenerationDate.getTime() - this.pauseTime;
    this.lastGenerationDate = new Date();
    this.pauseTime = 0;
    this.totalTime += this.lastGenerationDuration;
   
    // Get survivors and calculate maximum fitness for this generation
    const {survivors, fitnessMaxValue} = this.selectionMethod.getSurvivors(this);
    console.log("generation ", this.currentGen, " step ", this.currentStep, " survivors found: ", survivors.length);

    // Reset creatures
    this.grid.clearCreatures();
    this.currentCreatures = [];
    this.lastCreatureIdCreated = 0;   // resets at generation


    
    // Repopulate with survivors
    this.populationStrategy.populate(this, survivors);
    this.lastSurvivorsCount = survivors.length;
    this.lastSurvivalRate = this.lastSurvivorsCount / this.lastCreatureCount;
    this.lastFitnessMaxValue = fitnessMaxValue;

    // Generation registry
    this.generationRegistry.startGeneration();

    // Event
    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.startGeneration, { detail: { world: this } })
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

  hasBeenInitiated(): boolean {
    return (
      this.timeoutId != undefined ||
      this.currentStep > 0 ||
      this.currentGen > 0 ||
      this.currentCreatures.length > 0
    );
  }

  get isPaused(): boolean {
    return !this.timeoutId;
  }




  public relativeToWorld(x: number, y: number): number[] {
    const worldX = Math.floor(x * this.size);
    const worldY = Math.floor(y * this.size);

    return [worldX, worldY];
  }

 
 public redrawWorldCanvas() {
  this.worldCanvas.redraw(this.currentCreatures, this.objects, this.currentGen);
 }
 

}
