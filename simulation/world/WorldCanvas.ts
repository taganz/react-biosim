import Creature from "../creature/Creature";
import {GridPosition} from "./grid/Grid"
import WorldObject from "./objects/WorldObject";
import WorldController from "./WorldController";


export default class WorldCanvas {
  
  worldController : WorldController;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  size: number;  // world size (not canvas size!), used for conversion
    
  constructor(worldController: WorldController, canvas: HTMLCanvasElement, size: number)  {
    this.worldController = worldController;
    if (canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      this.size = size;    
      //console.log("WorldCanvas started. Size: ", this.size);
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

  public redraw(): void {
    this.worldController.generations.currentCreatures;
    this.clearCanvas();
    this.resizeCanvas();
    // RD
    this.ctx.fillStyle = 'rgba(200, 200, 200, 1)'; // Grey color - ok gif
    this.ctx.fillRect(0, 0,this.canvas.width,this.canvas.height);
    //this.generateWaterImage();

    //this.selectionMethod?.onDrawBeforeCreatures?.(this);

    // Draw creatures 
    for (let i = 0; i < this.worldController.generations.currentCreatures.length; i++) {
      const creature = this.worldController.generations.currentCreatures[i];

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
    for (let i = 0; i < this.worldController.objects.length; i++) {
      this.worldController.objects[i].draw(this.ctx, this.size);
    }

    // Draw generation #
    this.ctx.fillStyle = "#000";
    this.ctx.fill();
    this.ctx.font = "18px Courier";
    this.ctx.fillText("Gen ".concat(this.worldController.currentGen.toString()), 10, 20);
    
}


private generateWaterImage() {
  const grid = this.worldController.grid;
  const WATER_MAX = 400;   //TODO put constant value
  //const canvas = document.getElementById('waterCanvas');
  const context = this.ctx;

  const rows = this.worldController.size;
  const cols = this.worldController.size;

  this.canvas.width = cols;
  this.canvas.height = rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid.cell(col,row);
      //const brightness = 0.8 + 0.2*Math.min(cell.water / WATER_MAX, 1); // Ensure brightness is within [0, 1]
      const brightness = row / rows;
      const color = `rgb(0, ${brightness * 255}, ${brightness * 255}, 1)`; // Cyan color with brightness
      
      context.fillStyle = color;
      const x = col * this.size/rows;
      const y = row * this.size/cols;
      context.fillRect(x, y, 1, 1);
    }
  }
}


  // used to draw a small rectangle around selected creatures
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

  /*  NOT USED 15/5/24

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
  */

  
  /*  NOT USED 15/5/24


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

  */

  /*  NOT USED 15/5/24

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

  */

    /*  NOT USED 15/5/24
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
  */
}
