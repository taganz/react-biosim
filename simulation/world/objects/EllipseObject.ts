import { colors } from "../World";
import WorldObject from "../WorldObject";

export default class EllipseObject implements WorldObject {
  name = "EllipseObject";

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
    public drawIndividualPixels: boolean = true,
    public color: string = colors.obstacle
  ) {}

  clone() {
    return new EllipseObject(
      this.x,
      this.y,
      this.width,
      this.height,
      this.relative,
      this.drawIndividualPixels,
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

  draw(context: CanvasRenderingContext2D, worldSize: number) {
    context.fillStyle = this.color;

    if (this.drawIndividualPixels) {
      for (let pixelIdx = 0; pixelIdx < this.pixels.length; pixelIdx++) {
        const pixel = this.pixels[pixelIdx];

        context.beginPath();
        context.rect(
          context.canvas.width * (pixel[0] / worldSize),
          context.canvas.height * (pixel[1] / worldSize),
          context.canvas.width * (1.1 / worldSize),
          context.canvas.height * (1.1 / worldSize)
        );
        context.fill();
      }
    } else {
      const radiusX = this.width / 2;
      const radiusY = this.height / 2;

      context.beginPath();
      context.ellipse(
        context.canvas.width * (this.x + radiusX),
        context.canvas.height * (this.y + radiusY),
        context.canvas.width * radiusX,
        context.canvas.height * radiusY,
        0,
        0,
        2 * Math.PI
      );
      context.fill();
    }
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

    // Center
    const radiusX = width / 2;
    const radiusY = height / 2;
    const centerX = this.worldX + radiusX;
    const centerY = this.worldY + radiusY;

    // Recreate pixels
    this.pixels = [];
    for (let y = this.worldY; y < this.worldBottom && y < worldSize; y++) {
      for (let x = this.worldX; x < this.worldRight && x < worldSize; x++) {
        if (y >= 0 && x >= 0) {
          // We want to measure the distance to the center of the pixels and
          // not to their upper left corners, so me add 0.5
          const centeredX = x + 0.5;
          const centeredY = y + 0.5;

          // If the pixel is inside the ellipse
          if (
            ((centeredX - centerX) * (centeredX - centerX)) /
              (radiusX * radiusX) +
              ((centeredY - centerY) * (centeredY - centerY)) /
                (radiusY * radiusY) <=
            1
          ) {
            this.pixels.push([x, y]);
          }
        }
      }
    }
  }
}
