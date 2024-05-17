import WorldController from "@/simulation/world/WorldController";
import WorldCanvas from "@/simulation/world/WorldCanvas";
import Creature from "@/simulation/creature/Creature";
import { atom } from "jotai";
import * as constants from "@/simulation/simulationConstants"
import EventLogger from "@/simulation/logger/EventLogger";



// Controller
//export const sizeAtom = atom(constants.RUN_WORLD_SIZE);
export const worldControllerAtom = atom<WorldController | null>(null);
export const worldCanvasAtom = atom<WorldCanvas | null>(null);
//export const restartAtom = atom(false);
//export const restartCountAtom = atom(0);  // to refresh tabs on restart
export const worldCreaturesAtom = atom(<Creature[]>[]);
export const eventLoggerAtom = atom<EventLogger | null>(null);

export const selectedCreatureAtom = atom (<Creature | null>(null));

export const worldGenerationDataAtom = atom(constants.WORLD_GENERATIONS_DATA_DEFAULT);
export const worldControllerDataAtom = atom(constants.WORLD_CONTROLLER_DATA_DEFAULT);
export const waterDataAtom = atom(constants.WORLD_CONTROLLER_DATA_DEFAULT.waterData);

/*
export const currentGenAtom = atom( (get) => {
  const w = get(worldControllerAtom); 
  if (w) {
    return w.currentGen as unknown as number;
  }
  else {
    return 0;
  }
});
*/




