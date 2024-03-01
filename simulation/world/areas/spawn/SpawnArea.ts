import { colors } from "../../World";
import WorldObject from "../../WorldObject";

type WorldObjectConstructor = new (...args: any[]) => WorldObject;

export default function SpawnArea<TBase extends WorldObjectConstructor>(
  Base: TBase
) {
  return class SpawnAreaMixin extends Base implements WorldObject {
    color = colors.spawn;
    areaType = 2;
  };
}
