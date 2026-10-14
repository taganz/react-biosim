import Creature from "../creature/Creature";
import {GridPosition} from "./grid/Grid"
import WorldObject from "./objects/WorldObject";
import WorldController from "./WorldController";


export default class WorldCanvas {
  
  worldController : WorldController;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  size: number;  // world size (not canvas size!), used for conversion
  showWater: boolean = false;  // paint the water of the empty cells under the creatures
    
  constructor(worldController: WorldController, canvas: HTMLCanvasElement)  {
    this.worldController = worldController;
    if (canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      this.size = worldController.simData.worldControllerData.size;    
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
    // in case worldController restarted with a different size
    this.size = this.worldController.simData.worldControllerData.size;    
    this.worldController.generations.currentCreatures;
    this.clearCanvas();
    this.resizeCanvas();
    // RD
    this.ctx.fillStyle = 'rgba(200, 200, 200, 1)'; // Grey color - ok gif
    this.ctx.fillRect(0, 0,this.canvas.width,this.canvas.height);
    if (this.showWater) this.drawWater();

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

    // Draw objects. Reproduction areas (areaType 0) only matter to InsideReproductionAreaSelection,
    // and continuous runs never call the selection method
    const generations = this.worldController.generations;
    const showReproductionAreas = !generations.isContinuous
      && generations.selectionMethod.name === "InsideReproductionAreaSelection";
    for (let i = 0; i < this.worldController.objects.length; i++) {
      const obj = this.worldController.objects[i];
      if (obj.areaType === 0 && !showReproductionAreas) continue;
      obj.draw(this.ctx, this.size);
    }

    // Draw generation #
    this.ctx.fillStyle = "#000";
    this.ctx.font = "18px Courier";
    this.ctx.fillText("Gen ".concat(this.worldController.currentGen.toString()), 10, 20);
    
}


// Draws a ring around the selected creature on a separate overlay canvas, so the mark
// is never part of the world canvas (and of the GIFs or images saved from it).
// The ring is much larger than the creature (one cell) and white with a black outline,
// so it is visible on any creature or object color.
public drawSelectionOverlay(overlay: HTMLCanvasElement, creature: Creature | null): void {
  // same pixel size and on-screen size as the world canvas, so the ring lines up with the creature
  overlay.width = this.canvas.width;
  overlay.height = this.canvas.height;
  overlay.style.width = `${this.canvas.clientWidth}px`;
  overlay.style.height = `${this.canvas.clientHeight}px`;
  const ctx = overlay.getContext("2d") as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  if (!creature || !creature.isAlive) return;
  // a creature from a previous generation or run is not in the world anymore
  if (!this.worldController.generations.currentCreatures.includes(creature)) return;

  // each axis has its own cell size: the world canvas may not be exactly square
  const cellWidth = overlay.width / this.size;
  const cellHeight = overlay.height / this.size;
  const centerX = (creature.position[0] + 0.5) * cellWidth;
  const centerY = (creature.position[1] + 0.5) * cellHeight;
  const radius = Math.max(Math.min(cellWidth, cellHeight) * 2.5, 10);

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#000";
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
}

public setShowWater(showWater: boolean): void {
  this.showWater = showWater;
  this.redraw();
}

// Paints each empty cell from the grey background (no water) to blue (full),
// by its water as a fraction of its capacity. The image has one pixel per cell
// and is scaled up to the canvas, so it is cheap even for large worlds.
private drawWater(): void {
  const grid = this.worldController.grid;
  const size = this.size;
  const image = new ImageData(size, size);
  const data = image.data;
  const [r0, g0, b0] = [200, 200, 200];  // background grey
  const [r1, g1, b1] = [30, 90, 220];    // full cell

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = grid.cell(x, y);
      const ratio = cell.creature || cell.waterCapacity <= 0
        ? 0
        : Math.min(Math.max(cell.water / cell.waterCapacity, 0), 1);
      const i = (y * size + x) * 4;
      data[i] = r0 + (r1 - r0) * ratio;
      data[i + 1] = g0 + (g1 - g0) * ratio;
      data[i + 2] = b0 + (b1 - b0) * ratio;
      data[i + 3] = 255;
    }
  }

  const waterCanvas = document.createElement("canvas");
  waterCanvas.width = size;
  waterCanvas.height = size;
  (waterCanvas.getContext("2d") as CanvasRenderingContext2D).putImageData(image, 0, 0);
  this.ctx.imageSmoothingEnabled = false;
  this.ctx.drawImage(waterCanvas, 0, 0, this.canvas.width, this.canvas.height);
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
