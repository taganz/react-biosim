import { ActionName } from '../../creature/actions/CreatureActions';
import { SensorName } from '../../creature/sensors/CreatureSensors';
import WorldController from '@/simulation/world/WorldController';
import WorldGenerationData from '@/simulation/world/WorldGenerationData';
import {selectionMethodFormatter} from "@/simulation/creature/selection/SelectionMethodFormatter";
import {populationStrategyFormatter} from "@/simulation/creature/population/PopulationStrategyFormatter";
import SavedWorldGenerationData from "../data/SavedWorldGenerationData"
import SavedWorld from "../data/SavedWorld"
import {serializeMutationMode, deserializeMutationMode} from "@/simulation/creature/genome/MutationMode"

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


export function deserializeWorldGenerationData(parsed: SavedWorld) : WorldGenerationData{
        
  const worldGenerationData : WorldGenerationData = {
      // initial values
      populationStrategy: populationStrategyFormatter.deserialize(parsed.worldGenerationData.populationStrategy),
      selectionMethod: selectionMethodFormatter.deserialize(parsed.worldGenerationData.selectionMethod),
      initialPopulation: parsed.worldGenerationData.initialPopulation,
      initialGenomeSize: parsed.worldGenerationData.initialGenomeSize,
      maxGenomeSize: parsed.worldGenerationData.maxGenomeSize,
      maxNumberNeurons: parsed.worldGenerationData.maxNumberNeurons,
      mutationMode: deserializeMutationMode(parsed.worldGenerationData.mutationMode),
      mutationProbability: parsed.worldGenerationData.mutationProbability,
      deletionRatio: parsed.worldGenerationData.deletionRatio,
      geneInsertionDeletionProbability: parsed.worldGenerationData.geneInsertionDeletionProbability,
      enabledSensors: parsed.worldGenerationData.enabledSensors,
      enabledActions: parsed.worldGenerationData.enabledActions,
      
      //TODO alternativa es carregar-los aqui i despres copiar-los:

      //worldController.generations.sensors.loadFromList(parsed.worldGenerationData.enabledSensors);
      //worldController.generations.actions.loadFromList(parsed.worldGenerationData.enabledActions);
    

      // state values 
      lastCreatureIdCreated: parsed.worldGenerationData.lastCreatureIdCreated,
      lastCreatureCount: parsed.worldGenerationData.lastCreatureCount,
      lastSurvivorsCount: parsed.worldGenerationData.lastSurvivorsCount,
      lastFitnessMaxValue: parsed.worldGenerationData.lastFitnessMaxValue,
      lastSurvivalRate: parsed.worldGenerationData.lastSurvivalRate,
    }
  return worldGenerationData;
}

