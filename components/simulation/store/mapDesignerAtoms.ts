import WorldObject from "@/simulation/world/objects/WorldObject";
import { atom } from "jotai";

export const mapDesignerFullscreenAtom = atom(false);
export const mapDesignerWorldSizeAtom = atom<number>(0);
export const mapDesignerObjectsAtom = atom<WorldObject[]>([]);
export const mapDesignerSelectedObjectIndexAtom = atom<number | undefined>(
  undefined
);
