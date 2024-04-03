import { ActionName } from './../../creature/actions/CreatureActions';
import { SensorName } from './../../creature/sensors/CreatureSensors';
import { MutationMode } from "../../creature/genome/MutationMode";
import SavedGenerationRegistry from "./SavedGenerationRegistry";
import SavedSpecies from "./SavedSpecies";
import SavedWorldObject from "./SavedWorldObject";

export default interface SavedWorld {
  // World
  size: number;
  initialPopulation: number;
  currentGen: number;
  currentStep: number;
  timePerStep: number;
  stepsPerGen: number;
  immediateSteps: number;
  initialGenomeSize: number;
  maxGenomeSize: number;
  maxNumberNeurons: number;
  mutationProbability: number;
  geneInsertionDeletionProbability: number;
  deletionRatio: number;
  mutationMode: MutationMode;
  pauseBetweenGenerations: number;
  lastCreatureIdCreated: number;
  
  // Stats
  lastCreatureCount: number;
  lastSurvivorsCount: number;
  lastSurvivalRate: number;
  lastGenerationDuration: number;
  totalTime: number;

  // TODO: Handle populationStrategy
  // populationStrategy: PopulationStrategy = new AsexualRandomPopulation();
  // TODO: Handle selectionMethod
  // selectionMethod: SelectionMethod = new EastWallSelection();

  // Sensors and actions
  sensors: SensorName[];
  actions: ActionName[];

  // Species
  species: SavedSpecies[];

  objects: SavedWorldObject[];

  generations: SavedGenerationRegistry;
}
