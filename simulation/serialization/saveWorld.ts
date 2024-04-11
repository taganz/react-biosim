import { ActionName } from "./../creature/actions/CreatureActions";
import { SensorName } from "./../creature/sensors/CreatureSensors";
import WorldController from "../world/WorldController";
import SavedSpecies from "./data/SavedSpecies";
import SavedWorld from "./data/SavedWorld";
import SavedWorldObject from "./data/SavedWorldObject";
import generationRegistryFormatter from "./formatters/generationRegistryFormatter";
import objectFormatters from "./formatters/objectFormatters";
import WorldObject from "../world/WorldObject";

export function serializeSpecies(worldController: WorldController) {
  const creatureMap = new Map<string, SavedSpecies>();

  // Create the species from the creature list
  for (
    let creatureIdx = 0;
    creatureIdx < worldController.currentCreatures.length;
    creatureIdx++
  ) {
    const creature = worldController.currentCreatures[creatureIdx];
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

export function saveWorld(worldController: WorldController): SavedWorld {
  const sensors: SensorName[] = Object.entries(worldController.sensors.data)
    .filter(([_, { enabled }]) => enabled)
    .map(([key]) => key as SensorName);
  const actions: ActionName[] = Object.entries(worldController.actions.data)
    .filter(([_, { enabled }]) => enabled)
    .map(([key]) => key as ActionName);

  // Create the final array of species
  const species = serializeSpecies(worldController);

  // Save objects
  const objects = serializeObjects(worldController.objects);

  // Save generation registry
  const generations = generationRegistryFormatter.serialize(
    worldController.generationRegistry
  );

  return {
    size: worldController.size,
    initialPopulation: worldController.initialPopulation,
    currentGen: worldController.currentGen,
    currentStep: worldController.currentStep,
    pauseBetweenSteps: worldController.pauseBetweenSteps,
    stepsPerGen: worldController.stepsPerGen,
    immediateSteps: worldController.immediateSteps,
    initialGenomeSize: worldController.initialGenomeSize,
    maxGenomeSize: worldController.maxGenomeSize,
    maxNumberNeurons: worldController.maxNumberNeurons,
    mutationProbability: worldController.mutationProbability,
    geneInsertionDeletionProbability: worldController.geneInsertionDeletionProbability,
    deletionRatio: worldController.deletionRatio,
    mutationMode: worldController.mutationMode,
    pauseBetweenGenerations: worldController.pauseBetweenGenerations,
    lastCreatureIdCreated: worldController.lastCreatureIdCreated,

    species,

    lastCreatureCount: worldController.lastCreatureCount,
    lastSurvivorsCount: worldController.lastSurvivorsCount,
    lastSurvivalRate: worldController.lastSurvivalRate,
    lastGenerationDuration: worldController.lastGenerationDuration,
    totalTime: worldController.totalTime,

    sensors,
    actions,

    objects,
    generations,
  };
}
