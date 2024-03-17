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
    // A spawn zone at top left
    new RectangleSpawnArea(0.1, 0.1, 0.2, 0.2, true),
    // A reproduction zone at  center
    new RectangleReproductionArea(0.3, 0.6, 0.2, 0.4, true),
    // A map divided at bottom by 5 columns
    new RectangleObject(0.1, 0.6, 0.04, 0.4),
    new RectangleObject(0.3, 0.6, 0.04, 0.4),
    new RectangleObject(0.5, 0.6, 0.04, 0.4),
    new RectangleObject(0.7, 0.6, 0.04, 0.4),
    new RectangleObject(0.9, 0.6, 0.04, 0.4),
    
]);





