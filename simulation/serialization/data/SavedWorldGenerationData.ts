import { ActionName } from '../../creature/brain/CreatureActions';
import { SensorName } from '../../creature/brain/CreatureSensors';
import {SavedSelectionMethod} from "@/simulation/generations/selection/selectionMethodFormatter";
import {SavedPopulationStrategy} from "@/simulation/generations/population/xxxpopulationStrategyFormatter";
import {SavedMutationMode} from "@/simulation/creature/brain/MutationMode"
import {PhenoTypeColorMode} from "@/simulation/creature/PhenoTypeColorMode";

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
  metabolismEnabled: boolean;
  phenotypeColorMode: PhenoTypeColorMode;
  plantGenes: string;
  // state values 
  lastCreatureIdCreated: number;
  lastCreatureCount: number;
  lastSurvivorsCount: number;
  lastFitnessMaxValue: number;
  lastSurvivalRate: number;
}
