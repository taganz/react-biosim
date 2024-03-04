import { ActionName } from "@/simulation/creature/actions/CreatureActions";
import { MutationMode } from "@/simulation/creature/genome/MutationMode";
import { SensorName } from "@/simulation/creature/sensors/CreatureSensors";
import World from "@/simulation/world/World";
import { atom } from "jotai";

export const worldAtom = atom<World | null>(null);
export const restartAtom = atom(false);

// Initial settings
export const worldSizeAtom = atom(100);
export const initialPopulationAtom = atom(1000);
export const initialGenomeSizeAtom = atom(4);
export const maxGenomeSizeAtom = atom(30);
export const maxNeuronsAtom = atom(15);
export const mutationModeAtom = atom<MutationMode>(MutationMode.wholeGene);
export const mutationProbabilityAtom = atom(0.05);
export const geneInsertionDeletionProbabilityAtom = atom(0.015);

// Sensors
export const enabledSensorsAtom = atom<SensorName[]>([
  "HorizontalPosition",
  "VerticalPosition",
  "Age",
  "Oscillator",
  "Random",
  "HorizontalSpeed",
  "VerticalSpeed",
  "HorizontalBorderDistance",
  "VerticalBorderDistance",
  "BorderDistance",
]);
// Actions
export const enabledActionsAtom = atom<ActionName[]>([
  "MoveNorth",
  "MoveSouth",
  "MoveEast",
  "MoveWest",
  "RandomMove",
  "MoveForward",
]);
