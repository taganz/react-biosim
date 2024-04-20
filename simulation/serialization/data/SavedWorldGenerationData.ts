import { ActionName } from '../../creature/brain/CreatureActions';
import { SensorName } from '../../creature/brain/CreatureSensors';
import {SavedSelectionMethod} from "@/simulation/generations/selection/SelectionMethodFormatter";
import {SavedPopulationStrategy} from "@/simulation/generations/population/PopulationStrategyFormatter";
import {SavedMutationMode} from "@/simulation/creature/brain/MutationMode"


export default interface SavedWorldGenerationData {
  // initial values
  populationStrategy: SavedPopulationStrategy;
  selectionMethod: SavedSelectionMethod;
  initialPopulation: number;
  initialGenomeSize: number;
  maxGenomeSize: number;
  maxNumberNeurons: number;
  mutationMode: SavedMutationMode;
  mutationProbability: number;
  deletionRatio: number;
  geneInsertionDeletionProbability: number;
  enabledSensors: SensorName[];
  enabledActions: ActionName[];
  // state values 
  lastCreatureIdCreated: number;
  lastCreatureCount: number;
  lastSurvivorsCount: number;
  lastFitnessMaxValue: number;
  lastSurvivalRate: number;
}
