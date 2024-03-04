import EllipseObject from "../../objects/EllipseObject";
import HealthAreaMixin from "./HealthArea";

export default class EllipseHealthArea extends HealthAreaMixin(EllipseObject) {
  name = "EllipseHealthArea";

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    relative: boolean = true,
    public health: number = 0
  ) {
    super(x, y, width, height, relative);
  }

  clone() {
    return new EllipseHealthArea(
      this.x,
      this.y,
      this.width,
      this.height,
      this.relative,
      this.health
    );
  }
}
