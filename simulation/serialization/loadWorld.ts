import Creature from "../creature/Creature";
import Genome from "../creature/genome/Genome";
import { GenerationRegistry } from "../world/stats/GenerationRegistry";
import WorldController from "../world/WorldController";
import WorldObject from "../world/objects/WorldObject";
import SavedSpecies from "./data/SavedSpecies";
import SavedWorld from "./data/SavedWorld";
import SavedWorldObject from "./data/SavedWorldObject";
import generationRegistryFormatter from "./formatters/generationRegistryFormatter";
import objectFormatters from "./formatters/objectFormatters";
import WorldInitialValues from "../world/WorldInitialValues";
import {selectionMethodFormatter} from "@/simulation/creature/selection/SelectionMethodFormatter";
import {populationStrategyFormatter} from "@/simulation/creature/population/PopulationStrategyFormatter";
import {deserializeMutationMode} from "@/simulation/creature/genome/MutationMode"

export function deserializeObjects(objects: SavedWorldObject[]) : WorldObject[] {
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
function deserializeSpecies(worldController: WorldController, species: SavedSpecies[]) {
  const deserializedCreatures: Creature[] = [];
  species.forEach((savedSpecies) => {
    savedSpecies.creatures.forEach((savedCreature) => {
      const genome: Genome = new Genome(savedSpecies.genes);
      const creature = new Creature(worldController.generations, savedCreature.position, savedCreature.mass, genome);
      creature.lastMovement = savedCreature.lastMovement;
      creature.lastPosition = savedCreature.lastPosition;
      creature.massAtBirth = savedCreature.massAtBirth;

      deserializedCreatures.push(creature);
    });
  });

  return deserializedCreatures;
}

// can not load here, must be done in components to store atom
export function deserializeWorldInitialValues(parsed: SavedWorld) : WorldInitialValues{
  const worldInitialValues : WorldInitialValues = {
    // Load WorldInitialValues
    size: parsed.worldInitialValues.size,
    selectionMethod: selectionMethodFormatter.deserialize(parsed.worldInitialValues.selectionMethod),
    populationStrategy: populationStrategyFormatter.deserialize(parsed.worldInitialValues.populationStrategy),
    stepsPerGen: parsed.worldInitialValues.stepsPerGen,
    initialPopulation: parsed.worldInitialValues.initialPopulation,
    initialGenomeSize: parsed.worldInitialValues.initialGenomeSize,
    maxGenomeSize: parsed.worldInitialValues.maxGenomeSize,
    maxNumberNeurons: parsed.worldInitialValues.maxNumberNeurons,
    mutationMode: deserializeMutationMode(parsed.worldInitialValues.mutationMode),
    mutationProbability: parsed.worldInitialValues.mutationProbability,
    geneInsertionDeletionProbability: parsed.worldInitialValues.geneInsertionDeletionProbability,
    enabledSensors: parsed.worldInitialValues.enabledSensors,
    enabledActions: parsed.worldInitialValues.enabledActions,
    worldObjects: [...deserializeObjects(parsed.worldInitialValues.worldObjects)]
  }
  return worldInitialValues;
}

export function loadWorldControllerSimulationParameters (worldController: WorldController, parsed: SavedWorld) : void {
  worldController.currentGen = parsed.currentGen;
  worldController.currentStep = parsed.currentStep;
  worldController.pauseBetweenSteps = parsed.pauseBetweenSteps;
  worldController.immediateSteps = parsed.immediateSteps;
  worldController.deletionRatio = parsed.deletionRatio;
  worldController.pauseBetweenGenerations = parsed.pauseBetweenGenerations;
}

export function loadWorldControllerRunValues (worldController: WorldController, parsed: SavedWorld) : void {
    worldController.lastSurvivalRate = parsed.lastSurvivalRate;
    worldController.lastGenerationDuration = parsed.lastGenerationDuration;
    worldController.totalTime = parsed.totalTime;
}

function loadGenerationRegistry(worldController: WorldController, parsed: SavedWorld) : void {
    // Load generation registry
    if (parsed.generations) {
      worldController.generationRegistry = generationRegistryFormatter.deserialize(
        parsed.generations,
        worldController
      );
    } else {
      worldController.generationRegistry = new GenerationRegistry(worldController);
    }
  
}

function loadWorldGenerationValues (worldController: WorldController, parsed: SavedWorld) : void {
  worldController.generations.lastCreatureIdCreated = parsed.lastCreatureIdCreated;
  worldController.generations.lastCreatureCount = parsed.lastCreatureCount;
  worldController.generations.lastSurvivorsCount = parsed.lastSurvivorsCount;
  worldController.generations.currentGen = parsed.currentGen;
  worldController.generations.currentStep = parsed.currentStep;
  worldController.generations.stepsPerGen = parsed.worldInitialValues.stepsPerGen;
  worldController.generations.stepsPerGen = parsed.worldInitialValues.stepsPerGen;
  worldController.generations.initialPopulation = parsed.worldInitialValues.initialPopulation;
  worldController.generations.initialGenomeSize = parsed.worldInitialValues.initialGenomeSize;
  worldController.generations.maxGenomeSize = parsed.worldInitialValues.maxGenomeSize;
  worldController.generations.maxNumberNeurons = parsed.worldInitialValues.maxNumberNeurons;
  worldController.generations.mutationMode = deserializeMutationMode(parsed.worldInitialValues.mutationMode);  
  worldController.generations.mutationProbability = parsed.worldInitialValues.mutationProbability;
  worldController.generations.geneInsertionDeletionProbability = parsed.worldInitialValues.geneInsertionDeletionProbability;
  worldController.generations.sensors.loadFromList(parsed.worldInitialValues.enabledSensors);
  worldController.generations.actions.loadFromList(parsed.worldInitialValues.enabledActions);
  worldController.generations.selectionMethod = selectionMethodFormatter.deserialize(parsed.worldInitialValues.selectionMethod);
  worldController.generations.populationStrategy = populationStrategyFormatter.deserialize(parsed.worldInitialValues.populationStrategy);
  
  worldController.generations.currentCreatures = [...deserializeSpecies(worldController, parsed.species)];

}

// returns worldInitialValues to allow updating atom from calling component
export function loadWorld(worldController: WorldController, data: string) : WorldInitialValues {
  const parsed = JSON.parse(data) as SavedWorld;
  const worldInitialValues = deserializeWorldInitialValues(parsed);
  worldController.pause();
  loadWorldControllerSimulationParameters(worldController, parsed);  
  loadWorldControllerRunValues(worldController, parsed);  
  loadWorldGenerationValues(worldController, parsed);
  loadGenerationRegistry(worldController, parsed);  
  return worldInitialValues;
}
