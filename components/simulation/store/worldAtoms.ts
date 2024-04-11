import WorldController from "@/simulation/world/WorldController";
import WorldCanvas from "@/simulation/world/WorldCanvas";
import WorldInitialValues from "@/simulation/world/WorldInitialValues";
import Creature from "@/simulation/creature/Creature";
import { atom } from "jotai";
import * as constants from "@/simulation/simulationConstants"


// Controller
export const sizeAtom = atom(constants.RUN_WORLD_SIZE);
export const worldControllerAtom = atom<WorldController | null>(null);
export const worldCanvasAtom = atom<WorldCanvas | null>(null);
export const restartAtom = atom(false);
export const restartCountAtom = atom(0);  // to refresh tabs on restart
export const currentGenAtom = atom(0);
export const worldCreaturesAtom = atom(<Creature[]>[]);

//TO DO --- TREURE DES D'AQUI FINS ABAIX PERO CALDRA RETOCAR EL SETTINGS PANEL
// Run parameters
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


// Initial settings bundle
export const worldInitialValuesAtom_old = atom((get) => ({
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
//TO DO --- TREURE DES D'AQUI FINS ADALT PERO CALDRA RETOCAR EL SETTINGS PANEL



export const worldObjectsAtom = atom(constants.RUN_WORLD_OBJECTS);


const wiv : WorldInitialValues = {
  size : constants.RUN_WORLD_SIZE,
  selectionMethod: constants.RUN_SELECTION_METHOD,
  populationStrategy: constants.RUN_POPULATION_STRATEGY,
  stepsPerGen: constants.RUN_STEPS_PER_GENERATION,
  initialPopulation: constants.RUN_INITIAL_POPULATION,
  initialGenomeSize: constants.RUN_INITIAL_GENOME_SIZE,
  maxGenomeSize: constants.RUN_MAX_GENOME_SIZE,
  maxNumberNeurons: constants.RUN_MAX_NUMBER_NEURONS,
  mutationMode: constants.RUN_MUTATION_MODE,
  mutationProbability: constants.RUN_MUTATION_PROBABILITY,
  geneInsertionDeletionProbability: constants.RUN_GENE_INSERTION_DELETION_PROBABILITY,
  enabledSensors: constants.RUN_ENABLED_SENSORS,
  enabledActions: constants.RUN_ENABLED_ACTIONS,
  worldObjects : constants.RUN_WORLD_OBJECTS,
}
export const worldInitialValuesAtom = atom(wiv);







