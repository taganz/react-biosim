import CreatureActions from "../creature/actions/CreatureActions";
import Creature from "../creature/Creature";
import { MutationMode } from "../creature/genome/MutationMode";
//import AsexualRandomPopulation from "../creature/population/AsexualRandomPopulation";
import AsexualZonePopulation from "../creature/population/AsexualZonePopulation";
import PopulationStrategy from "../creature/population/PopulationStrategy";
import EastWallSelection from "../creature/selection/EastWallSelection";
import SelectionMethod from "../creature/selection/SelectionMethod";
import CreatureSensors from "../creature/sensors/CreatureSensors";
import { WorldEvents } from "../events/WorldEvents";
import { GenerationRegistry } from "./stats/GenerationRegistry";
import WorldObject from "./WorldObject";

type GridPoint = {
  creature: Creature | null;
  objects: WorldObject[];
  isSolid: boolean;
};
type Grid = Array<Array<GridPoint>>;

export const colors = {
  reproduction: "rgba(0,0,255,0.1)",
  obstacle: "rgb(60, 60, 60)",
  healing: "rgba(0,255,0, 0.1)",
  danger: "rgba(255,0,0, 0.1)",
  spawn: "rgba(255, 255, 0, 0.1)",

};

export default class World {
  static instance?: World;

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  size: number = 10;
  initialPopulation: number = 10;

  currentGen: number = 0;
  currentStep: number = 0;
  timePerStep: number = 0;
  stepsPerGen: number = 300;
  immediateSteps: number = 1;    // number of steps to run without redrawing
  initialGenomeSize: number = 20;
  maxGenomeSize: number = 30;
  maxNumberNeurons: number = 5;
  mutationProbability: number = 0.01;
  geneInsertionDeletionProbability: number = 0.005;
  deletionRatio: number = 0.5;
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

  // RD 1/3/24  -- see also SimulationCanvas
  populationStrategy:   PopulationStrategy = new AsexualZonePopulation(); 
  //populationStrategy: PopulationStrategy = new AsexualRandomPopulation();


  selectionMethod: SelectionMethod = new EastWallSelection();

  events: EventTarget = new EventTarget();
  timeoutId?: number;

  // World
  grid: Grid = [];
  objects: WorldObject[] = [];

  // Sensors and actions
  sensors: CreatureSensors = new CreatureSensors();
  actions: CreatureActions = new CreatureActions();

  constructor(canvas: HTMLCanvasElement | null, size: number) {
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
        "The population cannot be greater than the number of available tiles in the world"
      );
    }

    const survivors = this.selectionMethod.getSurvivors(this);

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
  }

  private initializeGrid(): void {
    // Generate pixels of objects
    for (let i = 0; i < this.objects.length; i++) {
      this.objects[i].computePixels(this.size);
    }

    // Initialize the grid
    this.grid = [];
    for (let x = 0; x < this.size; x++) {
      // Create column
      const col: Array<GridPoint> = [];
      for (let y = 0; y < this.size; y++) {
        // Create and push row
        col.push({ creature: null, objects: [], isSolid: false });
      }

      // Push column
      this.grid.push(col);
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
        this.grid[x][y].objects.push(obj);
        // Is it solid?
        if (obj.areaType === undefined) {
          this.grid[x][y].isSolid = true;
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

  private clearGrid() {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const point = this.grid[x][y];
        point.creature = null;
        // point.obstacle = null;
        // point.areas = [];
      }
    }
  }

  public computeGrid() {
    this.clearGrid();

    // Set creatures
    for (let i = 0; i < this.currentCreatures.length; i++) {
      const creature = this.currentCreatures[i];

      if (creature.isAlive) {
        // Set creature if it's alive
        this.grid[creature.position[0]][creature.position[1]].creature =
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

      // Recompute grid
      this.computeGrid();

      // Compute step of every creature
      for (let i = 0; i < this.currentCreatures.length; i++) {
        const creature = this.currentCreatures[i];
        if (creature.isAlive) {
          // Effect of the areas the creature is in
          const point = this.grid[creature.position[0]][creature.position[1]];
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
    for (let i = 0; i < this.currentCreatures.length; i++) {
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

  public getRandomPosition(): [number, number] {
    return [
      Math.floor(Math.random() * this.size),
      Math.floor(Math.random() * this.size),
    ];
  }

  public getRandomAvailablePosition() {
    // Generate a position until it corresponds to an empty tile
    let position: [number, number];
    do {
      position = this.getRandomPosition();
    } while (!this.isTileEmpty(position[0], position[1]));

    return position;
  }

  public isTileEmpty(x: number, y: number): boolean {
    // for (let i = 0; i < this.currentCreatures.length; i++) {
    //   const creature = this.currentCreatures[i];
    //   if (creature.isAlive && creature.position[0] === x && creature.position[1] === y) {
    //     return false;
    //   }
    // }
    // return true;

    const gridPoint = this.grid[x][y];
    return !this.grid[x][y].creature && !gridPoint.isSolid;
  }

  public getRandomAvailablePositionDeepCheck(
    creatures: Creature[]
  ): [number, number] {
    // Generate a position until it corresponds to an empty tile
    let position: [number, number];
    do {
      position = this.getRandomPosition();
    } while (!this.isTileEmptyDeepCheck(creatures, position[0], position[1]));

    return position;
  }
  
  

  // RD 
  public getCenteredAvailablePositionDeepCheck(creatures: Creature[], x: number, y: number, hw: number, hh: number): [number, number] {
    // Generate a position until it corresponds to an empty tile
    let position: [number, number];
    let hw2 : number = hw;
    let hh2 : number = hh;
    // if population doesn't fit inside the spawn area, make area bigger
    // note: won't work well if rectangle is partially outside the canvas?
    if (hw2 * hh2 * 4 < this.initialPopulation * 1.3) {
        hw2 = Math.sqrt(this.initialPopulation * hw2 / hh2);
        hh2 = Math.sqrt(this.initialPopulation * hh2 / hw2);
    }
    let warning = this.initialPopulation * 1.5; // basic infinite loop prevention
    do {
      if (warning-- == 0) {
        console.warn("getCenteredAvailablePositionDeepCheck -- warning == 0", hw2, hh2, this.initialPopulation);
        hw2 *= 1.3;
        hh2 *= 1.3;
        warning = this.initialPopulation * 1.5;
      }
      position = [
        Math.floor(x + (Math.random() * 2 - 1) * hw2),
        Math.floor(y + (Math.random() * 2 - 1) * hh2),
      ];
      position = this.clampWorld(position[0], position[1]);
      //console.log("warning: ", warning, "position ", position);
    } while (!this.isTileEmptyDeepCheck(creatures, position[0], position[1]));

    return position;
  }



  // RD 25/2/24  
  public clampWorld(x: number, y: number): [number, number] {
    const clampedX = Math.min(Math.max(x, 0), this.size-1);
    const clampedY = Math.min(Math.max(y, 0), this.size-1);
    return [clampedX, clampedY];
  }

  public isTileEmptyDeepCheck(
    creatures: Creature[],
    x: number,
    y: number
  ): boolean {
    let hasCreature = false;

    for (let i = 0; i < creatures.length; i++) {
      const creature = creatures[i];
      if (
        creature.isAlive &&
        creature.position[0] === x &&
        creature.position[1] === y
      ) {
        hasCreature = true;
        break;
      }
    }

    const gridPoint = this.grid[x][y];
    return !hasCreature && !gridPoint.isSolid;
  }

  public isTileInsideWorld(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) {
      return false;
    }

    return true;
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

    this.selectionMethod?.onDrawBeforeCreatures?.(this);

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

    this.selectionMethod?.onDrawAfterCreatures?.(this);

    // Draw objects
    for (let i = 0; i < this.objects.length; i++) {
      this.objects[i].draw(this.ctx, this.size);
    }
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
