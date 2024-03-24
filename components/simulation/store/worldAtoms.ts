import { ActionName } from "@/simulation/creature/actions/CreatureActions";
import { MutationMode } from "@/simulation/creature/genome/MutationMode";
import { SensorName } from "@/simulation/creature/sensors/CreatureSensors";
import World from "@/simulation/world/World";
import WorldObject from "@/simulation/world/WorldObject";
import { atom } from "jotai";
import SelectionMethod from "@/simulation/creature/selection/SelectionMethod";
import InsideReproductionAreaSelection from "@/simulation/creature/selection/InsideReproductionAreaSelection";
import PopulationStrategy from "@/simulation/creature/population/PopulationStrategy";
import AsexualZonePopulation from "@/simulation/creature/population/AsexualZonePopulation";
import RectangleReproductionArea from "@/simulation/world/areas/reproduction/RectangleReproductionArea";
import RectangleSpawnArea from "@/simulation/world/areas/spawn/RectangleSpawnArea";
import RectangleObject from "@/simulation/world/objects/RectangleObject";

// Controller
export const worldAtom = atom<World | null>(null);
export const restartAtom = atom(false);
export const restartCountAtom = atom(0);  // refresh tabs on restart

// Run parameters
export const sizeAtom = atom(100);
export const stepsPerGenAtom = atom(300);
export const initialPopulationAtom = atom(500);

// Simulation parameters
export const selectionMethodAtom = atom<SelectionMethod>(new InsideReproductionAreaSelection());
export const populationStrategyAtom = atom<PopulationStrategy>(new AsexualZonePopulation());
export const initialGenomeSizeAtom = atom(4);
export const maxGenomeSizeAtom = atom(30);
export const maxNumberNeuronsAtom = atom(15);
export const mutationModeAtom = atom<MutationMode>(MutationMode.wholeGene);
export const mutationProbabilityAtom = atom(0.05);
export const geneInsertionDeletionProbabilityAtom = atom(0.015);

// Creatures
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
export const enabledActionsAtom = atom<ActionName[]>([
  "MoveNorth",
  "MoveSouth",
  "MoveEast",
  "MoveWest",
  "RandomMove",
  "MoveForward",
]);

// Map objects
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


// Initial settings bundle
export const worldInitialValuesAtom = atom((get) => ({
  sizeAtom: get(sizeAtom), 
  selectionMethodAtom: get(selectionMethodAtom),
  populationStrategyAtom: get(populationStrategyAtom),
  stepsPerGenAtom: get(stepsPerGenAtom),
  initialPopulationAtom: get(initialPopulationAtom),
  initialGenomeSizeAtom: get(initialGenomeSizeAtom),
  maxGenomeSizeAtom: get(maxGenomeSizeAtom),
  maxNumberNeuronsAtom: get(maxNumberNeuronsAtom),
  mutationModeAtom: get(mutationModeAtom),
  mutationProbabilityAtom: get(mutationProbabilityAtom),
  geneInsertionDeletionProbabilityAtom: get(geneInsertionDeletionProbabilityAtom),
  enabledSensorsAtom: get(enabledSensorsAtom),
  enabledActionsAtom: get(enabledActionsAtom),
  worldObjectsAtom : get(worldObjectsAtom)
}))






