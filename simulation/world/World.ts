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


export default class World {
  static instance?: World;

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  
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
   grid: Grid;
   objects: WorldObject[] = [];   // to be set externally

   lastCreatureIdCreated : number = 0;

  // status
  currentGen: number = 0;
  currentStep: number = 0;
  timePerStep: number = 0;
  immediateSteps: number = 1;    // number of steps to run without redrawing
  deletionRatio: number = 0.5;    // --> not used?
  mutationMode: MutationMode = MutationMode.wholeGene;
  pauseBetweenGenerations: number = 0;

  currentCreatures: Creature[] = [];

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

  // RD 1/3/24  -- see also SimulationCanvas
  populationStrategy:   PopulationStrategy = new AsexualZonePopulation(); 
  //populationStrategy: PopulationStrategy = new AsexualRandomPopulation();


  //selectionMethod: SelectionMethod = new EastWallSelection();  
  selectionMethod: SelectionMethod = new InsideReproductionAreaSelection();  

  events: EventTarget = new EventTarget();
  timeoutId?: number;

 

  
  constructor(canvas: HTMLCanvasElement | null, size: number) {
    this.grid = new Grid(size);
    if (canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      this.size = size;

      window.addEventListener("resize", this.redraw.bind(this));
    } else {
      throw new Error("Cannot found canvas");
    }
  }

  public initializeWorld(restart: boolean): void {
    this.sensors.updateInternalValues();
    this.actions.updateInternalValues();

    // If there's a simulation already running
    if (restart) {
      this.pause();
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
    }
    
    this.initializeGrid();

    this.computeGrid();
    if (restart) {
      this.selectAndPopulate();
    }
    this.redraw();

    this.events.dispatchEvent(
      new CustomEvent(WorldEvents.initializeWorld, { detail: { world: this } })
    );
  }

  private selectAndPopulate(): void {
    if (this.initialPopulation >= this.size * this.size) {
      throw new Error(
        "The population cannot be greater than the number of available tiles in the world: ".concat(this.initialPopulation.toString(), " vs ", (this.size * this.size).toString())
      );
    }

    const {survivors, fitnessMaxValue} = this.selectionMethod.getSurvivors(this);

    
    // Small pause
    if (this.pauseBetweenGenerations > 0) {
      this.currentCreatures = survivors;
      this.redraw();
    }

    const newCreatures = this.populationStrategy.populate(this, survivors);
    this.currentCreatures = newCreatures;

    if (this.currentGen > 0) {
      this.lastSurvivorsCount = survivors.length;
      this.lastSurvivalRate = this.lastSurvivorsCount / this.lastCreatureCount;
    } else {
      console.log("New population:", newCreatures.length);
      console.log(`Genome size: ${this.initialGenomeSize} genes`);
    }

    this.lastCreatureCount = newCreatures.length;
    this.lastFitnessMaxValue = fitnessMaxValue;
    
  }

  // A creature wants to give birth. If there is some place near this position will return new creature. If not will return null
  // --> arreglar
  creatureBirth (parent : Creature, targetBirthPosition : [number, number]) : Creature | null {

    // --> revisar amb calma
    //var offspringPosition = this.getNearByAvailablePosic(this.currentCreatures, targetBirthPosition[0], targetBirthPosition[1], 100, 100);
    var creature : Creature | null = null;
    var offspringPositionTest : [number, number];
    var offspringPosition : [number, number] | null = null;
    offspringPositionTest = [targetBirthPosition[0], targetBirthPosition[1]];
    offspringPositionTest = this.grid.clamp(offspringPositionTest[0], offspringPositionTest[1]);
    if (!this.grid.isTileEmpty(offspringPositionTest[0], offspringPositionTest[1])) offspringPosition = offspringPositionTest;
    offspringPositionTest = [targetBirthPosition[0]+1, targetBirthPosition[1]];
    offspringPositionTest = this.grid.clamp(offspringPositionTest[0], offspringPositionTest[1]);
    if (!this.grid.isTileEmpty(offspringPositionTest[0], offspringPositionTest[1])) offspringPosition = offspringPositionTest;
    offspringPositionTest = [targetBirthPosition[0], targetBirthPosition[1]+1];
    offspringPositionTest = this.grid.clamp(offspringPositionTest[0], offspringPositionTest[1]);
    if (!this.grid.isTileEmpty(offspringPositionTest[0], offspringPositionTest[1])) offspringPosition = offspringPositionTest;
    offspringPositionTest = [targetBirthPosition[0]+1, targetBirthPosition[1]+1];
    offspringPositionTest = this.grid.clamp(offspringPositionTest[0], offspringPositionTest[1]);
    if (!this.grid.isTileEmpty(offspringPositionTest[0], offspringPositionTest[1])) offspringPosition = offspringPositionTest;
    offspringPositionTest = [targetBirthPosition[0]-1, targetBirthPosition[1]];
    offspringPositionTest = this.grid.clamp(offspringPositionTest[0], offspringPositionTest[1]);
    if (!this.grid.isTileEmpty(offspringPositionTest[0], offspringPositionTest[1])) offspringPosition = offspringPositionTest;
    offspringPositionTest = [targetBirthPosition[0]+1, targetBirthPosition[1]-1];
    offspringPositionTest = this.grid.clamp(offspringPositionTest[0], offspringPositionTest[1]);
    if (!this.grid.isTileEmpty(offspringPositionTest[0], offspringPositionTest[1])) offspringPosition = offspringPositionTest;
    offspringPositionTest = [targetBirthPosition[0]-1, targetBirthPosition[1]-1];
    offspringPositionTest = this.grid.clamp(offspringPositionTest[0], offspringPositionTest[1]);
    if (!this.grid.isTileEmpty(offspringPositionTest[0], offspringPositionTest[1])) offspringPosition = offspringPositionTest;
    offspringPositionTest = [targetBirthPosition[0]+1, targetBirthPosition[1]-1];
    offspringPositionTest = this.grid.clamp(offspringPositionTest[0], offspringPositionTest[1]);
    if (!this.grid.isTileEmpty(offspringPositionTest[0], offspringPositionTest[1])) offspringPosition = offspringPositionTest;
    offspringPositionTest = [targetBirthPosition[0]-1, targetBirthPosition[1]+1];
    offspringPositionTest = this.grid.clamp(offspringPositionTest[0], offspringPositionTest[1]);
    if (!this.grid.isTileEmpty(offspringPositionTest[0], offspringPositionTest[1])) offspringPosition = offspringPositionTest;
    
    if (offspringPosition) {
      creature = new Creature(this, offspringPosition, parent.massAtBirth, parent.genome);
      this.currentCreatures.push(creature);
    }
  
    return creature;
  }
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
      this.computeGrid();

      // Compute step of every creature
      console.log("entering step creatures: ", this.currentCreatures.length);
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

    this.redraw();


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
      this.initializeWorld(true);
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
    this.lastCreatureIdCreated = 0;

    this.selectAndPopulate();

    // Generation registry
    this.generationRegistry.startGeneration();

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


  public mouseEventPosToWorld(e: MouseEvent): number[] {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const relativeX = x / rect.width;
    const relativeY = y / rect.height;
    return [
      Math.floor(relativeX * this.size),
      Math.floor(relativeY * this.size),
    ];
  }

  public relativeToWorld(x: number, y: number): number[] {
    const worldX = Math.floor(x * this.size);
    const worldY = Math.floor(y * this.size);

    return [worldX, worldY];
  }

  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private resizeCanvas(): void {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  public redraw(): void {
    this.clearCanvas();
    this.resizeCanvas();
    // RD
    this.ctx.fillStyle = 'rgba(200, 200, 200, 1)'; // Grey color with 10% opacity
    this.ctx.fillRect(0, 0,this.canvas.width,this.canvas.height);

    //this.selectionMethod?.onDrawBeforeCreatures?.(this);

    // Draw creatures 
    for (let i = 0; i < this.currentCreatures.length; i++) {
      const creature = this.currentCreatures[i];

      if (creature.isAlive) {
        const position = creature.position;

        const normalizedX = position[0] / this.size;
        const normalizedY = position[1] / this.size;
        const absoluteSize = 1 / this.size;

        this.ctx.fillStyle = creature.getColor();
        this.ctx.beginPath();
        this.ctx.rect(
          normalizedX * this.canvas.width,
          normalizedY * this.canvas.height,
          absoluteSize * this.canvas.width,
          absoluteSize * this.canvas.height
        );
        this.ctx.fill();
      }
    }

    //this.selectionMethod?.onDrawAfterCreatures?.(this);

    // Draw objects
    for (let i = 0; i < this.objects.length; i++) {
      this.objects[i].draw(this.ctx, this.size);
    }

    // Draw generation #
    this.ctx.fillStyle = "#000";
    this.ctx.fill();
    this.ctx.font = "18px Courier";
    this.ctx.fillText("Gen ".concat(this.currentGen.toString()), 10, 20);
    
}

  public drawRectStroke(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    lineWidth: number
  ): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.rect(
      this.canvas.width * (x / this.size),
      this.canvas.height * (y / this.size),
      this.canvas.width * (width / this.size),
      this.canvas.height * (height / this.size)
    );
    this.ctx.stroke();
  }

  public drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ): void {
    this.ctx.fillStyle = color;

    this.ctx.beginPath();
    this.ctx.rect(
      this.canvas.width * (x / this.size),
      this.canvas.height * (y / this.size),
      this.canvas.width * (width / this.size),
      this.canvas.height * (height / this.size)
    );
    this.ctx.fill();
  }

  public drawEllipse(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ): void {
    const radiusX = width / 2;
    const radiusY = height / 2;
    this.ctx.fillStyle = color;

    this.ctx.beginPath();
    this.ctx.ellipse(
      this.canvas.width * ((x + radiusX) / this.size),
      this.canvas.height * ((y + radiusY) / this.size),
      this.canvas.width * (radiusX / this.size),
      this.canvas.height * (radiusY / this.size),
      0,
      0,
      2 * Math.PI
    );
    this.ctx.fill();
  }

  public drawRelativeRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ): void {
    this.ctx.fillStyle = color;

    this.ctx.beginPath();
    this.ctx.rect(
      this.canvas.width * x,
      this.canvas.height * y,
      this.canvas.width * width,
      this.canvas.height * height
    );
    this.ctx.fill();
  }

  public isInsideRelativeRect(
    x: number,
    y: number,
    recX: number,
    recY: number,
    recWidth: number,
    recHeight: number
  ): boolean {
    const absoluteWidth = this.size * recWidth;
    const absoluteHeight = this.size * recHeight;
    const absoluteX = this.size * recX;
    const absoluteY = this.size * recY;

    return (
      x >= absoluteX &&
      x < absoluteX + absoluteWidth &&
      y >= absoluteY &&
      y < absoluteY + absoluteHeight
    );
  }
}
