import { ActionName } from '../../creature/brain/CreatureActions';
import { SensorName } from '../../creature/brain/CreatureSensors';
import WorldController from '@/simulation/world/WorldController';
import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';
import { selectionMethodFormatter } from '@/simulation/generations/selection/selectionMethodFormatter';
import {populationStrategyFormatter} from "@/simulation/generations/population/populationStrategyFormatter";
import SavedWorldGenerationData from "../data/SavedWorldGenerationData"
import {serializeMutationMode, deserializeMutationMode} from "@/simulation/creature/brain/MutationMode"
import { SimulationData } from '@/simulation/SimulationData';
import { SavedSimulationData } from '../data/SavedSimulationData';

export function serializeWorldGenerationData(worldController: WorldController) 
            : SavedWorldGenerationData {
    const wg = worldController.generations;

    const sensors: SensorName[] = Object.entries(wg.sensors.data)
    .filter(([_, { enabled }]) => enabled)
    .map(([key]) => key as SensorName);

    const actions: ActionName[] = Object.entries(wg.actions.data)
    .filter(([_, { enabled }]) => enabled)
    .map(([key]) => key as ActionName);

    return {
    // initial values
    simulationType: wg.simulationType,
    maxAge: wg.maxAge,
    populationStrategy: populationStrategyFormatter.serialize(worldController.generations.populationStrategy),  
    selectionMethod: selectionMethodFormatter.serialize(worldController.generations.selectionMethod),
    initialPopulation: wg.initialPopulation,
    initialGenomeSize: wg.initialGenomeSize,
    maxGenomeSize: wg.maxGenomeSize,
    maxNumberNeurons: wg.maxNumberNeurons,
    mutationMode: serializeMutationMode(wg.mutationMode),
    mutationProbability: wg.mutationProbability,
    deletionRatio: wg.deletionRatio,
    geneInsertionDeletionProbability: wg.geneInsertionDeletionProbability,
    enabledSensors: sensors,
    enabledActions: actions,
    metabolismEnabled: wg.metabolismEnabled,
    phenotypeColorMode: wg.phenotypeColorMode,
    plantGenes: JSON.stringify(wg.worldGenerationsData.plantGenes),
    // state values 
    lastCreatureIdCreated: wg.lastCreatureIdCreated,  
    lastCreatureCount: wg.lastCreatureCount,
    lastSurvivorsCount: wg.lastSurvivorsCount,
    lastFitnessMaxValue: wg.lastFitnessMaxValue,
    lastSurvivalRate: wg.lastSurvivalRate,
    }
}


// Older files had a Continuous population strategy and a Continuous selection method
// instead of a simulation type. They load as a continuous run; Random Fixed Gene builds
// generation 1 as the old Continuous strategy did.
const LEGACY_CONTINUOUS_POPULATION = "ContinuousPopulation";
const LEGACY_CONTINUOUS_SELECTION = "ContinuousSelection";
const DEFAULT_MAX_AGE = 1000;

export function deserializeWorldGenerationData(parsed: SavedSimulationData) : WorldGenerationsData{

  const saved = parsed.worldGenerationsData;
  const isLegacyContinuous = saved.populationStrategy === LEGACY_CONTINUOUS_POPULATION
    || saved.selectionMethod === LEGACY_CONTINUOUS_SELECTION;
  const populationStrategy = saved.populationStrategy === LEGACY_CONTINUOUS_POPULATION
    ? "RandomFixedGenePopulation"
    : saved.populationStrategy;
  const selectionMethod = saved.selectionMethod === LEGACY_CONTINUOUS_SELECTION
    ? "InsideReproductionAreaSelection"
    : saved.selectionMethod;

  const worldGenerationsData : WorldGenerationsData = {
      // initial values
      simulationType: saved.simulationType ?? (isLegacyContinuous ? "continuous" : "generational"),
      maxAge: saved.maxAge ?? DEFAULT_MAX_AGE,
      populationStrategy: populationStrategyFormatter.deserialize(populationStrategy),
      selectionMethod: selectionMethodFormatter.deserialize(selectionMethod),
      initialPopulation: parsed.worldGenerationsData.initialPopulation,
      initialGenomeSize: parsed.worldGenerationsData.initialGenomeSize,
      maxGenomeSize: parsed.worldGenerationsData.maxGenomeSize,
      maxNumberNeurons: parsed.worldGenerationsData.maxNumberNeurons,
      mutationMode: deserializeMutationMode(parsed.worldGenerationsData.mutationMode),
      mutationProbability: parsed.worldGenerationsData.mutationProbability,
      deletionRatio: parsed.worldGenerationsData.deletionRatio,
      geneInsertionDeletionProbability: parsed.worldGenerationsData.geneInsertionDeletionProbability,
      enabledSensors: parsed.worldGenerationsData.enabledSensors,
      enabledActions: parsed.worldGenerationsData.enabledActions,
      metabolismEnabled: parsed.worldGenerationsData.metabolismEnabled,
      phenotypeColorMode: parsed.worldGenerationsData.phenotypeColorMode,
      plantGenes: JSON.parse(parsed.worldGenerationsData.plantGenes),
      
      //TODO alternativa es carregar-los aqui i despres copiar-los:

      //worldController.generations.sensors.loadFromList(parsed.worldGenerationsData.enabledSensors);
      //worldController.generations.actions.loadFromList(parsed.worldGenerationsData.enabledActions);
    

      // state values 
      lastCreatureIdCreated: parsed.worldGenerationsData.lastCreatureIdCreated,
      lastCreatureCount: parsed.worldGenerationsData.lastCreatureCount,
      lastSurvivorsCount: parsed.worldGenerationsData.lastSurvivorsCount,
      lastFitnessMaxValue: parsed.worldGenerationsData.lastFitnessMaxValue,
      lastSurvivalRate: parsed.worldGenerationsData.lastSurvivalRate,
    }
  return worldGenerationsData;
}

