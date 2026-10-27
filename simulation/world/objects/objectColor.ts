import { CONSTANTS_DEFAULT } from "@/simulation/constantsDefault";
import type WorldObject from "./WorldObject";

export type ObjectColors = typeof CONSTANTS_DEFAULT.colors;

/**
 * The color an obstacle or area is drawn with, from the `colors` constants of the simulation.
 * Without them (or with a key missing, in older files) areas take the default colors and
 * obstacles their own color.
 */
export default function objectColor(obj: WorldObject, colors?: Partial<ObjectColors>): string {
  switch (obj.areaType) {
    case 0:
      return colors?.reproduction ?? CONSTANTS_DEFAULT.colors.reproduction;
    case 1:
      return (obj as WorldObject & { health: number }).health >= 0
        ? colors?.healing ?? CONSTANTS_DEFAULT.colors.healing
        : colors?.danger ?? CONSTANTS_DEFAULT.colors.danger;
    case 2:
      return colors?.spawn ?? CONSTANTS_DEFAULT.colors.spawn;
    default:
      return colors?.obstacle ?? obj.color;
  }
}
