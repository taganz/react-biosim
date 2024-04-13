import { ActionName } from '../../creature/actions/CreatureActions';
import { SensorName } from '../../creature/sensors/CreatureSensors';
import { MutationMode } from "../../creature/genome/MutationMode";
import SavedWorldObject from './SavedWorldObject';
import {SavedSelectionMethod} from "@/simulation/creature/selection/SelectionMethodFormatter";
import {SavedPopulationStrategy} from "@/simulation/creature/population/PopulationStrategyFormatter";

export default interface SavedWorldInitialValues {
  size: number;
  selectionMethod: SavedSelectionMethod;
  populationStrategy: SavedPopulationStrategy;
  stepsPerGen: number;
  initialPopulation: number;
  initialGenomeSize: number;
  maxGenomeSize: number;
  maxNumberNeurons: number;
  mutationMode: MutationMode;
  mutationProbability: number;
  geneInsertionDeletionProbability: number;
  enabledSensors: SensorName[];
  enabledActions: ActionName[];
  worldObjects: SavedWorldObject[];
}
