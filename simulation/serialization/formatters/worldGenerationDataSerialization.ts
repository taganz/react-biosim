import { ActionName } from '../../creature/brain/CreatureActions';
import { SensorName } from '../../creature/brain/CreatureSensors';
import WorldController from '@/simulation/world/WorldController';
import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';
import { selectionMethodFormatter } from '@/simulation/generations/selection/selectionMethodFormatter';
import {populationStrategyFormatter} from "@/simulation/generations/population/populationStrategyFormatter";
import SavedWorldGenerationData from "../data/SavedWorldGenerationData"
import {serializeMutationMode, deserializeMutationMode} from "@/simulation/creature/brain/MutationMode"

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
    plantGenes: [...wg.worldGenerationsData.plantGenes],
    // state values 
    lastCreatureIdCreated: wg.lastCreatureIdCreated,  
    lastCreatureCount: wg.lastCreatureCount,
    lastSurvivorsCount: wg.lastSurvivorsCount,
    lastFitnessMaxValue: wg.lastFitnessMaxValue,
    lastSurvivalRate: wg.lastSurvivalRate,
    }
}


// reads the current format: older files go through migrateSavedSimulationData() first
export function deserializeWorldGenerationData(saved: SavedWorldGenerationData) : WorldGenerationsData {
  return {
    ...saved,
    populationStrategy: populationStrategyFormatter.deserialize(saved.populationStrategy),
    selectionMethod: selectionMethodFormatter.deserialize(saved.selectionMethod),
    mutationMode: deserializeMutationMode(saved.mutationMode),
    plantGenes: [...saved.plantGenes],
  };
}
