import Creature from "../../../creature/Creature";
import { CONSTANTS_DEFAULT } from "@/simulation/simulationDataDefault";
import WorldObject from "../../objects/WorldObject";

type WorldObjectType = new (...args: any[]) => WorldObject;

export interface HealthArea extends WorldObject {
  health: number;
}

export default function HealthAreaMixin<TBase extends WorldObjectType>(
  Base: TBase
) {
  return class HealthAreaMixin extends Base implements WorldObject, HealthArea {
    health: number = 0;
    areaType = 1;
    color = CONSTANTS_DEFAULT.colors.healing;

    areaEffectOnCreature(creature: Creature) {
      creature.health += this.health;
    }

    draw(context: CanvasRenderingContext2D, worldSize: number) {
      this.color = this.health >= 0 ? CONSTANTS_DEFAULT.colors.healing : CONSTANTS_DEFAULT.colors.danger;
      super.draw(context, worldSize);
    }
  };
}
