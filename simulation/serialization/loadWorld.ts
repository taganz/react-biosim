import Creature from "../creature/Creature";
import Genome from "../creature/genome/Genome";
import { GenerationRegistry } from "../world/stats/GenerationRegistry";
import WorldController from "../world/WorldController";
import WorldObject from "../world/WorldObject";
import SavedSpecies from "./data/SavedSpecies";
import SavedWorld from "./data/SavedWorld";
import SavedWorldInitialValues from "./data/SavedWorldInitialValues";
import SavedWorldObject from "./data/SavedWorldObject";
import generationRegistryFormatter from "./formatters/generationRegistryFormatter";
import objectFormatters from "./formatters/objectFormatters";
import WorldInitialValues from "../world/WorldInitialValues";
import {SavedSelectionMethod, selectionMethodFormatter} from "@/simulation/creature/selection/SelectionMethodFormatter";
import {SavedPopulationStrategy, populationStrategyFormatter} from "@/simulation/creature/population/PopulationStrategyFormatter";

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

function deserializeWorldInitialValues(parsed: SavedWorld) : WorldInitialValues{
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
    mutationMode: parsed.worldInitialValues.mutationMode,
    mutationProbability: parsed.worldInitialValues.mutationProbability,
    geneInsertionDeletionProbability: parsed.worldInitialValues.geneInsertionDeletionProbability,
    enabledSensors: parsed.worldInitialValues.enabledSensors,
    enabledActions: parsed.worldInitialValues.enabledActions,
    worldObjects: deserializeObjects(parsed.worldInitialValues.worldObjects)
  }
  return worldInitialValues;
}

function loadWorldRunValues (worldController: WorldController, parsed: SavedWorld) : void {
    worldController.currentGen = parsed.currentGen;
    worldController.currentStep = parsed.currentStep;
    worldController.deletionRatio = parsed.deletionRatio;
    worldController.pauseBetweenSteps = parsed.pauseBetweenSteps;
    worldController.immediateSteps = parsed.immediateSteps;
    worldController.pauseBetweenGenerations = parsed.pauseBetweenGenerations;
    worldController.generations.lastCreatureIdCreated = parsed.lastCreatureIdCreated;
    // Stats
    worldController.generations.lastCreatureCount = parsed.lastCreatureCount;
    worldController.generations.lastSurvivorsCount = parsed.lastSurvivorsCount;
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

// returns worldInitialValues to allow updating atom from calling component
export function loadWorld(worldController: WorldController, data: string) : WorldInitialValues {
  const parsed = JSON.parse(data) as SavedWorld;
  const worldInitialValues = deserializeWorldInitialValues(parsed);
  worldController.pause();
  loadWorldRunValues(worldController, parsed);  
  // Load creatures
  worldController.generations.currentCreatures = deserializeSpecies(worldController, parsed.species);
  loadGenerationRegistry(worldController, parsed);  
  return worldInitialValues;
}
