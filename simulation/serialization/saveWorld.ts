import { ActionName } from "./../creature/actions/CreatureActions";
import { SensorName } from "./../creature/sensors/CreatureSensors";
import WorldController from "../world/WorldController";
import SavedSpecies from "./data/SavedSpecies";
import SavedWorld from "./data/SavedWorld";
import SavedWorldInitialValues from "./data/SavedWorldInitialValues";
import SavedWorldObject from "./data/SavedWorldObject";
import generationRegistryFormatter from "./formatters/generationRegistryFormatter";
import objectFormatters from "./formatters/objectFormatters";
import WorldObject from "../world/WorldObject";
import WorldInitialValues from "@/simulation/world/WorldInitialValues";
import {SavedSelectionMethod, selectionMethodFormatter} from "@/simulation/creature/selection/SelectionMethodFormatter";
import {SavedPopulationStrategy, populationStrategyFormatter} from "@/simulation/creature/population/PopulationStrategyFormatter";

export function serializeObjects(objects: WorldObject[]) {
  const serializedObjects: SavedWorldObject[] = [];

  for (let objectIndex = 0; objectIndex < objects.length; objectIndex++) {
    const obj = objects[objectIndex];

    // Find the formatter
    const className: string = obj.name;
    const formatter = objectFormatters[className];
    if (formatter) {
      // If the formatter was found, serialize the object
      const data = formatter.serialize(obj);
      // Save it
      const item: SavedWorldObject = {
        data,
        type: className,
      };
      serializedObjects.push(item);
    }
  }

  return serializedObjects;
}

function serializeSpecies(worldController: WorldController) {
  const creatureMap = new Map<string, SavedSpecies>();

  // Create the species from the creature list
  for (
    let creatureIdx = 0;
    creatureIdx < worldController.generations.currentCreatures.length;
    creatureIdx++
  ) {
    const creature = worldController.generations.currentCreatures[creatureIdx];
    const genomeString = creature.genome.toDecimalString(false);

    let species: SavedSpecies | undefined = creatureMap.get(genomeString);
    if (!species) {
      species = {
        genes: creature.genome.genes,
        creatures: [],
      };
      creatureMap.set(genomeString, species);
    }

    species.creatures.push({
      lastMovement: creature.lastMovement,
      lastPosition: creature.lastPosition,
      position: creature.lastPosition,
      mass: creature.mass,
      massAtBirth: creature.massAtBirth
    });
  }

  // Create the final array of species
  const species: SavedSpecies[] = Array.from(creatureMap.values()).sort(
    (a, b) => b.creatures.length - a.creatures.length
  );

  return species;
}

function serializeWorldInitialValues(worldController: WorldController, worldInitialValues: WorldInitialValues) : SavedWorldInitialValues{
  
  const sensors: SensorName[] = Object.entries(worldController.generations.sensors.data)
    .filter(([_, { enabled }]) => enabled)
    .map(([key]) => key as SensorName);

  const actions: ActionName[] = Object.entries(worldController.generations.actions.data)
    .filter(([_, { enabled }]) => enabled)
    .map(([key]) => key as ActionName);

  const objects = serializeObjects(worldController.objects);
  
  const serializedData : SavedWorldInitialValues = {
    size: worldInitialValues.size,
    selectionMethod: selectionMethodFormatter.serialize(worldInitialValues.selectionMethod),
    populationStrategy: populationStrategyFormatter.serialize(worldInitialValues.populationStrategy),  
    stepsPerGen: worldInitialValues.stepsPerGen,
    initialPopulation: worldInitialValues.initialPopulation,
    initialGenomeSize: worldInitialValues.initialGenomeSize,
    maxGenomeSize: worldInitialValues.maxGenomeSize,
    maxNumberNeurons: worldInitialValues.maxNumberNeurons,
    mutationMode: worldInitialValues.mutationMode,
    mutationProbability: worldInitialValues.mutationProbability,
    geneInsertionDeletionProbability: worldInitialValues.geneInsertionDeletionProbability,
    
    enabledSensors: worldInitialValues.enabledSensors,
    enabledActions: worldInitialValues.enabledActions,
    
    worldObjects: objects

  };

  return serializedData

};

export function saveWorld(worldController: WorldController, currentWorldInitialValues: WorldInitialValues): SavedWorld {

  const serializedWorldInitialValues = serializeWorldInitialValues(worldController, currentWorldInitialValues);
  const species = serializeSpecies(worldController);
  const generations = generationRegistryFormatter.serialize(worldController.generationRegistry);

  return {

    worldInitialValues: serializedWorldInitialValues,

    currentGen: worldController.currentGen,
    currentStep: worldController.currentStep,
    pauseBetweenSteps: worldController.pauseBetweenSteps,
    immediateSteps: worldController.immediateSteps,
    deletionRatio: worldController.deletionRatio,
    pauseBetweenGenerations: worldController.pauseBetweenGenerations,
    lastCreatureIdCreated: worldController.generations.lastCreatureIdCreated,
    lastCreatureCount: worldController.generations.lastCreatureCount,
    lastSurvivorsCount: worldController.generations.lastSurvivorsCount,
    lastSurvivalRate: worldController.lastSurvivalRate,
    lastGenerationDuration: worldController.lastGenerationDuration,
    totalTime: worldController.totalTime,

    species,
    generations
    
  };
}
