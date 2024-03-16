import { ActionName } from "@/simulation/creature/actions/CreatureActions";
import { MutationMode } from "@/simulation/creature/genome/MutationMode";
import { SensorName } from "@/simulation/creature/sensors/CreatureSensors";
import World from "@/simulation/world/World";
import WorldObject from "@/simulation/world/WorldObject";
import { atom } from "jotai";
import RectangleReproductionArea from "@/simulation/world/areas/reproduction/RectangleReproductionArea";
import RectangleSpawnArea from "@/simulation/world/areas/spawn/RectangleSpawnArea";
import RectangleObject from "@/simulation/world/objects/RectangleObject";
export const worldAtom = atom<World | null>(null);
export const restartAtom = atom(false);

// Initial settings
export const sizeAtom = atom(100);
export const stepsPerGenAtom = atom(300);
export const initialPopulationAtom = atom(500);
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


// Initial settings
export const worldInitialValuesAtom = atom((get) => ({
  sizeAtom: get(sizeAtom), 
  stepsPerGenAtom: get(stepsPerGenAtom),
  initialPopulationAtom: get(initialPopulationAtom),
  initialGenomeSizeAtom: get(initialGenomeSizeAtom),
  maxGenomeSizeAtom: get(maxGenomeSizeAtom),
  maxNeuronsAtom: get(maxNeuronsAtom),
  mutationModeAtom: get(mutationModeAtom),
  mutationProbabilityAtom: get(mutationProbabilityAtom),
  geneInsertionDeletionProbabilityAtom: get(geneInsertionDeletionProbabilityAtom),
  enabledSensorsAtom: get(enabledSensorsAtom),
  enabledActionsAtom: get(enabledActionsAtom)
}))

// Initial settings
export const worldObjectsAtom = atom<WorldObject[]>([
    // A reproduction zone at the center
    new RectangleReproductionArea(0.25, 0.25, 0.5, 0.5, true),
    // A map divided in two sections by 5 squares
    new RectangleObject(0, 0, 0.2, 0.2),
    new RectangleObject(0.2, 0.2, 0.2, 0.2),
    new RectangleObject(0.4, 0.4, 0.2, 0.2),
    new RectangleObject(0.6, 0.6, 0.2, 0.2),
    new RectangleObject(0.8, 0.8, 0.2, 0.2),
    // A spawn zone at the center
    new RectangleSpawnArea(0.4, 0.4, 0.2, 0.2, true),
]);





