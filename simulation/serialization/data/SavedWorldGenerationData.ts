import { ActionName } from '../../creature/actions/CreatureActions';
import { SensorName } from '../../creature/sensors/CreatureSensors';
import {SavedSelectionMethod} from "@/simulation/creature/selection/SelectionMethodFormatter";
import {SavedPopulationStrategy} from "@/simulation/creature/population/PopulationStrategyFormatter";
import {SavedMutationMode} from "@/simulation/creature/genome/MutationMode"


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
