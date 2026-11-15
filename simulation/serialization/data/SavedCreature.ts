import { GridPosition } from "@/simulation/world/grid/Grid";

export default interface SavedCreature {
  position: GridPosition;
  lastPosition: GridPosition;
  lastMovement: [number, number];
  mass: number,
  massAtBirth : number,
  /** steps lived; older files do not have it */
  age?: number
  /** with stamina below 1: the charge towards the next thought and the urge to move of the
   *  last one (inertia). Older files do not have them */
  thinkCharge?: number
  urgeToMove?: [number, number]
}
