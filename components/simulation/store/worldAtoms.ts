import World from "@/simulation/world/World";
import { atom } from "jotai";
import * as constants from "@/simulation/simulationConstants"

// Controller
export const worldAtom = atom<World | null>(null);
export const restartAtom = atom(false);
export const restartCountAtom = atom(0);  // to refresh tabs on restart

// Run parameters
export const sizeAtom = atom(constants.RUN_WORLD_SIZE);
export const stepsPerGenAtom = atom(constants.RUN_STEPS_PER_GENERATION);
export const initialPopulationAtom = atom(constants.RUN_INITIAL_POPULATION);

// Simulation parameters
export const selectionMethodAtom = atom(constants.RUN_SELECTION_METHOD);
export const populationStrategyAtom = atom(constants.RUN_POPULATION_STRATEGY);
export const initialGenomeSizeAtom = atom(constants.RUN_INITIAL_GENOME_SIZE);
export const maxGenomeSizeAtom = atom(constants.RUN_MAX_GENOME_SIZE);
export const maxNumberNeuronsAtom = atom(constants.RUN_MAX_NUMBER_NEURONS);
export const mutationModeAtom = atom(constants.RUN_MUTATION_MODE);
export const mutationProbabilityAtom = atom(constants.RUN_MUTATION_PROBABILITY);
export const geneInsertionDeletionProbabilityAtom = atom(constants.RUN_GENE_INSERTION_DELETION_PROBABILITY);

// Creatures
export const enabledSensorsAtom = atom(constants.RUN_ENABLED_SENSORS);
export const enabledActionsAtom = atom(constants.RUN_ENABLED_ACTIONS);

// Map objects
export const worldObjectsAtom = atom(constants.RUN_WORLD_OBJECTS);


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






