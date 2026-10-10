import Creature from "../../creature/Creature";

/** An obstacle or area of the map. See docs/model/world.md */
export default interface WorldObject {
  /** Class name; saved in files and used as key in objectFormatters */
  name: string;

  /** Position and size as fractions (0 - 1) of the world size */
  x: number;
  y: number;
  width: number;
  height: number;

  pixels: [number, number][];
  color: string;

  computePixels(worldSize: number): void;
  draw(context: CanvasRenderingContext2D, worldSize: number): void;
  clone(): WorldObject;

  /** 0 reproduction, 1 health, 2 spawn; undefined means a solid obstacle */
  areaType?: number;
  /** Effect on a creature standing in the area (not called at present, see WorldGenerations.step) */
  areaEffectOnCreature?(creature: Creature): void;
}
