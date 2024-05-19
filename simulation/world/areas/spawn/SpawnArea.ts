import { CONSTANTS_DEFAULT } from "@/simulation/simulationDataDefault";
import WorldObject from "../../objects/WorldObject";

type WorldObjectConstructor = new (...args: any[]) => WorldObject;

export default function SpawnArea<TBase extends WorldObjectConstructor>(
  Base: TBase
) {
  return class SpawnAreaMixin extends Base implements WorldObject {
    color = CONSTANTS_DEFAULT.colors.spawn;
    areaType = 2;
  };
}
