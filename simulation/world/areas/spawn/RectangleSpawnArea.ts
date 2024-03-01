import RectangleObject from "../../objects/RectangleObject";
import World from "../../World";
import SpawnArea from "./SpawnArea";

export default class RectangleSpawnArea extends SpawnArea(
  RectangleObject
) {
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    relative: boolean = true
  ) {
    super(x, y, width, height, relative);
  }

  clone() {
    return new RectangleSpawnArea(
      this.x,
      this.y,
      this.width,
      this.height,
      this.relative
    );
  }
}
