import { CONSTANTS_DEFAULT } from "@/simulation/simulationDataDefault";
import WorldObject from "../../objects/WorldObject";

type WorldObjectConstructor = new (...args: any[]) => WorldObject;

export default function ReproductionArea<TBase extends WorldObjectConstructor>(
  Base: TBase
) {
  return class ReproductionAreaMixin extends Base implements WorldObject {
    color = CONSTANTS_DEFAULT.colors.reproduction;
    areaType = 0;
  };
}
