import WorldController from "@/simulation/world/WorldController";
import WorldCanvas from "@/simulation/world/WorldCanvas";
import Creature from "@/simulation/creature/Creature";
import { Species } from "@/simulation/creature/Species";
import { atom } from "jotai";
import {SIMULATION_DATA_DEFAULT}  from "@/simulation/simulationDataDefault"
import EventLogger from "@/simulation/logger/EventLogger";
import { GridPosition } from "@/simulation/world/grid/Grid";



// Controller
//export const sizeAtom = atom(constants.RUN_WORLD_SIZE);
export const worldControllerAtom = atom<WorldController | null>(null);
export const worldCanvasAtom = atom<WorldCanvas | null>(null);
//export const restartAtom = atom(false);
//export const restartCountAtom = atom(0);  // to refresh tabs on restart
export const worldCreaturesAtom = atom(<Creature[]>[]);
export const eventLoggerAtom = atom<EventLogger | null>(null);

export const selectedCreatureAtom = atom (<Creature | null>(null));
export const selectedSpeciesAtom = atom<Species | undefined>(undefined);
// an empty cell clicked on the world; null while a creature is selected
export const selectedCellAtom = atom<GridPosition | null>(null);
// the "Select creature id" field of the Population tab. It is emptied when that creature is selected,
// when the user stops waiting and when the user selects another creature
export const waitForCreatureTextAtom = atom("");

// selection made by the user (world click, species box, toolbar). Choosing a creature this way
// stops waiting for a creature by id; automatic selections use selectedCreatureAtom directly
export const userSelectCreatureAtom = atom(null, (get, set, creature: Creature | null) => {
  set(selectedCreatureAtom, creature);
  if (creature) {
    get(worldControllerAtom)?.watchCreatureId(null);
    set(waitForCreatureTextAtom, "");
  }
});

// when and for how long Start recording records, in Stats → Logger; not saved
export const logFromFirstGenerationAtom = atom(false);
export const logOneGenerationAtom = atom(true);

export const simulationDataAtom = atom(SIMULATION_DATA_DEFAULT);
//export const simulationConstantsDataAtom = atom(SIMULATION_DATA_DEFAULT.constants);
//export const worldGenerationDataAtom = atom(SIMULATION_DATA_DEFAULT.worldGenerationsData);
//export const worldControllerDataAtom = atom(SIMULATION_DATA_DEFAULT.worldControllerData);
//export const waterDataAtom = atom(SIMULATION_DATA_DEFAULT.waterData);
//export const worldObjectsDataAtom = atom(SIMULATION_DATA_DEFAULT.worldObjects);
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




