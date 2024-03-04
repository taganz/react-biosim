import Creature from "@/simulation/creature/Creature";
import { lerp } from "../../helpers/helpers";
import World, { colors } from "../World";
import WorldObject from "../WorldObject";

export default class MovingRectangleObstacle implements WorldObject {
  name = "MovingRectangleObstacle";

  pixels: [number, number][] = [];

  absoluteX: number = 0;
  absoluteY: number = 0;
  absoluteWidth: number = 0;
  absoluteHeight: number = 0;

  constructor(
    public world: World,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public finalX: number,
    public finalY: number,
    public finalWidth: number,
    public finalHeight: number,
    public relative: boolean = true,
    public color: string = colors.obstacle
  ) {
    if (relative) {
      this.setRelativeTransform(x, y, width, height);
    } else {
      this.setWorldTransform(x, y, width, height);
    }
  }
  clone(): WorldObject {
    throw new Error("Method not implemented.");
  }
  areaType?: number | undefined;
  areaEffectOnCreature?(creature: Creature): void {
    throw new Error("Method not implemented.");
  }

  clone(): WorldObject {
    throw new Error("Method not implemented.");
  }

  areaType?: number | undefined;
  areaEffectOnCreature?(creature: Creature): void {
    throw new Error("Method not implemented.");
  }

  computePixels() {
    throw new Error("Method not implemented.");
  }

  computeStep() {
    const life = this.world.currentStep / this.world.stepsPerGen;
    // console.log(life)
    const x = lerp(this.x, this.finalX, life);
    const y = lerp(this.y, this.finalY, life);
    const width = lerp(this.width, this.finalWidth, life);
    const height = lerp(this.height, this.finalHeight, life);

    if (this.relative) {
      this.setRelativeTransform(x, y, width, height);
    } else {
    }
  }

  draw() {
    this.world.drawRect(
      this.absoluteX,
      this.absoluteY,
      this.absoluteWidth,
      this.absoluteHeight,
      "rgba(0, 0, 0, 0.5)"
    );
  }

  setRelativeTransform(
    left: number,
    top: number,
    width: number,
    height: number
  ) {
    const worldSize = this.world.size - 1;

    // Calculate world coordinates
    const absoluteWidth = Math.ceil(width * worldSize);
    const absoluteHeight = Math.ceil(height * worldSize);
    left = Math.ceil(left * worldSize);
    top = Math.ceil(top * worldSize);

    this.setWorldTransform(left, top, absoluteWidth, absoluteHeight);
  }

  setWorldTransform(left: number, top: number, width: number, height: number) {
    const worldSize = this.world.size - 1;

    // Calculate world coordinates
    const right = left + width;
    const bottom = top + height;

    // Save rounded values
    this.absoluteX = left;
    this.absoluteY = top;
    this.absoluteWidth = width;
    this.absoluteHeight = height;

    // Generate pixels
    this.pixels = [];
    for (let y = top; y < bottom && y <= worldSize; y++) {
      for (let x = left; x < right && y <= worldSize; x++) {
        this.pixels.push([x, y]);
      }
    }
  }
}
