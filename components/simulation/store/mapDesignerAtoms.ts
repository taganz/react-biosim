import WorldObject from "@/simulation/world/objects/WorldObject";
import { atom, SetStateAction } from "jotai";
import { simulationDataAtom } from "./worldAtoms";

export const mapDesignerFullscreenAtom = atom(false);
// the map designer edits the map of the Scenario draft, at the draft's world size
export const mapDesignerWorldSizeAtom = atom((get) => get(simulationDataAtom).worldControllerData.size);
export const mapDesignerObjectsAtom = atom(
  (get) => get(simulationDataAtom).worldObjects,
  (get, set, update: SetStateAction<WorldObject[]>) => {
    const simulationData = get(simulationDataAtom);
    const worldObjects = typeof update === "function" ? update(simulationData.worldObjects) : update;
    set(simulationDataAtom, { ...simulationData, worldObjects });
  }
);
export const mapDesignerSelectedObjectIndexAtom = atom<number | undefined>(
  undefined
);
