import EllipseObject from "../../objects/EllipseObject";
import World from "../../World";
import ReproductionArea from "./ReproductionArea";

export default class EllipseReproductionArea extends ReproductionArea(
  EllipseObject
) {
  name = "EllipseReproductionArea";

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
    return new EllipseReproductionArea(
      this.x,
      this.y,
      this.width,
      this.height,
      this.relative
    );
  }
}
