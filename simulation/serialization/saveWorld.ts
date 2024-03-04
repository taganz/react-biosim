import { ActionName } from "./../creature/actions/CreatureActions";
import { SensorName } from "./../creature/sensors/CreatureSensors";
import World from "../world/World";
import SavedSpecies from "./data/SavedSpecies";
import SavedWorld from "./data/SavedWorld";
import SavedWorldObject from "./data/SavedWorldObject";
import generationRegistryFormatter from "./formatters/generationRegistryFormatter";
import objectFormatters from "./formatters/objectFormatters";
import WorldObject from "../world/WorldObject";

export function serializeSpecies(world: World) {
  const creatureMap = new Map<string, SavedSpecies>();

  // Create the species from the creature list
  for (
    let creatureIdx = 0;
    creatureIdx < world.currentCreatures.length;
    creatureIdx++
  ) {
    const creature = world.currentCreatures[creatureIdx];
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

export function saveWorld(world: World): SavedWorld {
  const sensors: SensorName[] = Object.entries(world.sensors.data)
    .filter(([_, { enabled }]) => enabled)
    .map(([key]) => key as SensorName);
  const actions: ActionName[] = Object.entries(world.actions.data)
    .filter(([_, { enabled }]) => enabled)
    .map(([key]) => key as ActionName);

  // Create the final array of species
  const species = serializeSpecies(world);

  // Save objects
  const objects = serializeObjects(world.objects);

  // Save generation registry
  const generations = generationRegistryFormatter.serialize(
    world.generationRegistry
  );

  return {
    size: world.size,
    initialPopulation: world.initialPopulation,
    currentGen: world.currentGen,
    currentStep: world.currentStep,
    timePerStep: world.timePerStep,
    stepsPerGen: world.stepsPerGen,
    immediateSteps: world.immediateSteps,
    initialGenomeSize: world.initialGenomeSize,
    maxGenomeSize: world.maxGenomeSize,
    maxNumberNeurons: world.maxNumberNeurons,
    mutationProbability: world.mutationProbability,
    geneInsertionDeletionProbability: world.geneInsertionDeletionProbability,
    deletionRatio: world.deletionRatio,
    mutationMode: world.mutationMode,
    pauseBetweenGenerations: world.pauseBetweenGenerations,

    species,

    lastCreatureCount: world.lastCreatureCount,
    lastSurvivorsCount: world.lastSurvivorsCount,
    lastSurvivalRate: world.lastSurvivalRate,
    lastGenerationDuration: world.lastGenerationDuration,
    totalTime: world.totalTime,

    sensors,
    actions,

    objects,
    generations,
  };
}
