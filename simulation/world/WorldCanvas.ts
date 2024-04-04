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
import Genome from "@/simulation/creature/genome/Genome";


export default class WorldCanvas {
  
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  size: number;
  /*
  static instance?: World;

  
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

 */

  
  constructor(canvas: HTMLCanvasElement | null, size: number) {
    if (canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      this.size = size;    
    } else {
      throw new Error("Cannot found canvas");
    }
  }



  public mouseEventPosToWorld(e: MouseEvent): GridPosition {
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


  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private resizeCanvas(): void {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  public redraw(currentCreatures: Creature[], objects: WorldObject[], currentGen: number ): void {
    this.clearCanvas();
    this.resizeCanvas();
    // RD
    this.ctx.fillStyle = 'rgba(200, 200, 200, 1)'; // Grey color with 10% opacity
    this.ctx.fillRect(0, 0,this.canvas.width,this.canvas.height);

    //this.selectionMethod?.onDrawBeforeCreatures?.(this);

    // Draw creatures 
    for (let i = 0; i < currentCreatures.length; i++) {
      const creature = currentCreatures[i];

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
    for (let i = 0; i < objects.length; i++) {
      objects[i].draw(this.ctx, this.size);
    }

    // Draw generation #
    this.ctx.fillStyle = "#000";
    this.ctx.fill();
    this.ctx.font = "18px Courier";
    this.ctx.fillText("Gen ".concat(currentGen.toString()), 10, 20);
    
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
