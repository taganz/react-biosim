import WorldController from "@/simulation/world/WorldController";
import WorldCanvas from "@/simulation/world/WorldCanvas";
import WorldGenerationData from "@/simulation/world/WorldGenerationData";
import WorldControllerData from "@/simulation/world/WorldControllerData";
import Creature from "@/simulation/creature/Creature";
import { atom } from "jotai";
import * as constants from "@/simulation/simulationConstants"


// Controller
//export const sizeAtom = atom(constants.RUN_WORLD_SIZE);
export const worldControllerAtom = atom<WorldController | null>(null);
export const worldCanvasAtom = atom<WorldCanvas | null>(null);
//export const restartAtom = atom(false);
//export const restartCountAtom = atom(0);  // to refresh tabs on restart
export const currentGenAtom = atom(0);
export const worldCreaturesAtom = atom(<Creature[]>[]);


const wgd : WorldGenerationData = {
  // initial values
  populationStrategy: constants.RUN_POPULATION_STRATEGY,
  selectionMethod: constants.RUN_SELECTION_METHOD,
  initialPopulation: constants.RUN_INITIAL_POPULATION,
  initialGenomeSize: constants.RUN_INITIAL_GENOME_SIZE,
  maxGenomeSize: constants.RUN_MAX_GENOME_SIZE,
  maxNumberNeurons: constants.RUN_MAX_NUMBER_NEURONS,
  mutationMode: constants.RUN_MUTATION_MODE,
  mutationProbability: constants.RUN_MUTATION_PROBABILITY,
  deletionRatio: constants.RUN_DELETION_RATIO,
  geneInsertionDeletionProbability: constants.RUN_GENE_INSERTION_DELETION_PROBABILITY,
  enabledSensors: constants.RUN_ENABLED_SENSORS,
  enabledActions: constants.RUN_ENABLED_ACTIONS,
  // state values 
  lastCreatureIdCreated: 0,
  lastCreatureCount: 0,
  lastSurvivorsCount: 0,
  lastFitnessMaxValue: 0,
  lastSurvivalRate: 0
}
export const worldGenerationDataAtom = atom(wgd);


const wcd : WorldControllerData = {
  // initial values
  size : constants.RUN_WORLD_SIZE,
  stepsPerGen: constants.RUN_STEPS_PER_GENERATION,
  initialPopulation: constants.RUN_INITIAL_POPULATION,
  worldObjects : constants.RUN_WORLD_OBJECTS,
  // user values
  pauseBetweenSteps: constants.PAUSE_BETWEEN_STEPS,
  immediateSteps: constants.IMMEDIATE_STEPS,
  pauseBetweenGenerations: constants.PAUSE_BETWEEN_GENERATIONS,
  
  // state values
  currentGen: 0,
  currentStep: 0,
  lastGenerationDuration: 0,
  totalTime: 0
}
export const worldControllerDataAtom = atom(wcd);






