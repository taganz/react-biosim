import Creature from "../creature/Creature";
import Genome from "../creature/genome/Genome";
import { GenerationRegistry } from "../world/stats/GenerationRegistry";
import WorldController from "../world/WorldController";
import WorldObject from "../world/WorldObject";
import SavedSpecies from "./data/SavedSpecies";
import SavedWorld from "./data/SavedWorld";
import SavedWorldObject from "./data/SavedWorldObject";
import generationRegistryFormatter from "./formatters/generationRegistryFormatter";
import objectFormatters from "./formatters/objectFormatters";

export function deserializeSpecies(world: WorldController, species: SavedSpecies[]) {
  const deserializedCreatures: Creature[] = [];

  species.forEach((savedSpecies) => {
    savedSpecies.creatures.forEach((savedCreature) => {
      const genome: Genome = new Genome(savedSpecies.genes);
      const creature = new Creature(worldController, savedCreature.position, savedCreature.mass, genome);
      creature.lastMovement = savedCreature.lastMovement;
      creature.lastPosition = savedCreature.lastPosition;
      creature.massAtBirth = savedCreature.massAtBirth;

      deserializedCreatures.push(creature);
    });
  });

  return deserializedCreatures;
}

export function deserializeObjects(objects: SavedWorldObject[]) {
  // Clear worldController objects
  const deserializedObjects: WorldObject[] = [];

  // Load objects
  objects.forEach((savedObject) => {
    const formatter = objectFormatters[savedObject.type];

    if (formatter) {
      const worldObject: WorldObject = formatter.deserialize(savedObject.data);
      deserializedObjects.push(worldObject);
    }
  });

  return deserializedObjects;
}

export function loadWorld(worldController: WorldController, data: string) {
  const parsed = JSON.parse(data) as SavedWorld;

  worldController.pause();

  // Load basic worldController data
  worldController.size = parsed.size;
  worldController.initialPopulation = parsed.initialPopulation;
  worldController.currentGen = parsed.currentGen;
  worldController.currentStep = parsed.currentStep;
  worldController.pauseBetweenSteps = parsed.pauseBetweenSteps;
  worldController.stepsPerGen = parsed.stepsPerGen;
  worldController.immediateSteps = parsed.immediateSteps;
  worldController.initialGenomeSize = parsed.initialGenomeSize;
  worldController.maxGenomeSize = parsed.maxGenomeSize;
  worldController.maxNumberNeurons = parsed.maxNumberNeurons;
  worldController.mutationProbability = parsed.mutationProbability;
  worldController.geneInsertionDeletionProbability =
    parsed.geneInsertionDeletionProbability;
  worldController.deletionRatio = parsed.deletionRatio;
  worldController.mutationMode = parsed.mutationMode;
  worldController.pauseBetweenGenerations = parsed.pauseBetweenGenerations;
  worldController.lastCreatureIdCreated = parsed.lastCreatureIdCreated;

  // Stats
  worldController.lastCreatureCount = parsed.lastCreatureCount;
  worldController.lastSurvivorsCount = parsed.lastSurvivorsCount;
  worldController.lastSurvivalRate = parsed.lastSurvivalRate;
  worldController.lastGenerationDuration = parsed.lastGenerationDuration;
  worldController.totalTime = parsed.totalTime;

  // Enable sensors and actions
  worldController.sensors.loadFromList(parsed.sensors);
  worldController.actions.loadFromList(parsed.actions);

  // Load creatures
  worldController.currentCreatures = deserializeSpecies(worldController, parsed.species);

  // Load objects
  worldController.objects = deserializeObjects(parsed.objects);

  // Load generation registry
  if (parsed.generations) {
    worldController.generationRegistry = generationRegistryFormatter.deserialize(
      parsed.generations,
      worldController
    );
  } else {
    worldController.generationRegistry = new GenerationRegistry(worldController);
  }

  // Initialize worldController
  worldController.startRun();
}
