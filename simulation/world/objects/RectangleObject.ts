import { colors } from "../World";
import WorldObject from "../WorldObject";

export default class RectangleObject implements WorldObject {
  name = "RectangleObject";

  pixels: [number, number][] = [];

  worldX: number = 0;
  worldY: number = 0;
  worldWidth: number = 0;
  worldHeight: number = 0;
  worldRight: number = 0;
  worldBottom: number = 0;

  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public relative: boolean = true,
    public color: string = colors.obstacle
  ) {}

  clone() {
    return new RectangleObject(
      this.x,
      this.y,
      this.width,
      this.height,
      this.relative,
      this.color
    );
  }

  computePixels(worldSize: number) {
    // Recalculate transform and pixels
    this.computeTransform(worldSize);
  }

  computeTransform(worldSize: number) {
    if (this.relative) {
      this.setRelativeTransform(
        worldSize,
        this.x,
        this.y,
        this.width,
        this.height
      );
    } else {
      this.setWorldTransform(
        worldSize,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  draw(context: CanvasRenderingContext2D) {
    context.fillStyle = this.color;

    context.beginPath();
    context.rect(
      context.canvas.width * this.x,
      context.canvas.height * this.y,
      context.canvas.width * this.width,
      context.canvas.height * this.height
    );
    context.fill();
  }

  setRelativeTransform(
    worldSize: number,
    left: number,
    top: number,
    width: number,
    height: number
  ) {
    // Calculate world coordinates
    const absoluteWidth = Math.floor(width * worldSize);
    const absoluteHeight = Math.floor(height * worldSize);
    left = Math.floor(left * worldSize);
    top = Math.floor(top * worldSize);

    this.setWorldTransform(worldSize, left, top, absoluteWidth, absoluteHeight);
  }

  setWorldTransform(
    worldSize: number,
    left: number,
    top: number,
    width: number,
    height: number
  ) {
    // Calculate world coordinates
    this.worldRight = left + width;
    this.worldBottom = top + height;

    // Save rounded values
    this.worldX = left;
    this.worldY = top;
    this.worldWidth = width;
    this.worldHeight = height;

    // Recreate pixels
    this.pixels = [];
    for (let y = this.worldY; y < this.worldBottom && y < worldSize; y++) {
      for (let x = this.worldX; x < this.worldRight && x < worldSize; x++) {
        if (y >= 0 && x >= 0) {
          this.pixels.push([x, y]);
        }
      }
    }
  }
}
