import { ActionName } from '../../creature/brain/CreatureActions';
import { SensorName } from '../../creature/brain/CreatureSensors';
import WorldController from '@/simulation/world/WorldController';
import WorldGenerationsData from '@/simulation/generations/WorldGenerationsData';
import {selectionMethodFormatter} from "@/simulation/generations/selection/SelectionMethodFormatter";
import {populationStrategyFormatter} from "@/simulation/generations/population/PopulationStrategyFormatter";
import SavedWorldGenerationData from "../data/SavedWorldGenerationData"
import SavedWorld from "../data/SavedWorld"
import {serializeMutationMode, deserializeMutationMode} from "@/simulation/creature/brain/MutationMode"

export default function serializeWorldGenerationData(worldController: WorldController) : SavedWorldGenerationData {
    const wg = worldController.generations;

    const sensors: SensorName[] = Object.entries(wg.sensors.data)
    .filter(([_, { enabled }]) => enabled)
    .map(([key]) => key as SensorName);

    const actions: ActionName[] = Object.entries(wg.actions.data)
    .filter(([_, { enabled }]) => enabled)
    .map(([key]) => key as ActionName);

    return {
    // initial values
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
    // state values 
    lastCreatureIdCreated: wg.lastCreatureIdCreated,
    lastCreatureCount: wg.lastCreatureCount,
    lastSurvivorsCount: wg.lastSurvivorsCount,
    lastFitnessMaxValue: wg.lastFitnessMaxValue,
    lastSurvivalRate: wg.lastSurvivalRate
    }
}


export function deserializeWorldGenerationData(parsed: SavedWorld) : WorldGenerationsData{
        
  const worldGenerationsData : WorldGenerationsData = {
      // initial values
      populationStrategy: populationStrategyFormatter.deserialize(parsed.worldGenerationsData.populationStrategy),
      selectionMethod: selectionMethodFormatter.deserialize(parsed.worldGenerationsData.selectionMethod),
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

