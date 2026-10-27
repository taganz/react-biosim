import { GridPosition } from "@/simulation/world/grid/Grid";

export default interface SavedCreature {
  position: GridPosition;
  lastPosition: GridPosition;
  lastMovement: [number, number];
  mass: number,
  massAtBirth : number,
  /** steps lived; older files do not have it */
  age?: number
}
