import EllipseObject from "../../objects/EllipseObject";
import World from "../../World";
import ReproductionArea from "./ReproductionArea";

export default class EllipseReproductionArea extends ReproductionArea(
  EllipseObject
) {
  constructor(
    world: World,
    x: number,
    y: number,
    width: number,
    height: number,
    relative: boolean = true
  ) {
    super(world, x, y, width, height, relative);
  }
}
