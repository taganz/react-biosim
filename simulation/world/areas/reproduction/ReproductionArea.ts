import { colors } from "@/simulation/simulationConstants";
import WorldObject from "../../WorldObject";

type WorldObjectConstructor = new (...args: any[]) => WorldObject;

export default function ReproductionArea<TBase extends WorldObjectConstructor>(
  Base: TBase
) {
  return class ReproductionAreaMixin extends Base implements WorldObject {
    color = colors.reproduction;
    areaType = 0;
  };
}
