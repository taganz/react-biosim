import { startUpScenarioSimulationData as startup } from "@/simulation/startupScenario";
import { DEFAULT_GENUS_PROBABILITIES } from "@/simulation/constantsDefault";
import { SimulationData } from "@/simulation/SimulationData";
import RectangleObject from "@/simulation/world/objects/RectangleObject";
import Genome from "@/simulation/creature/brain/Genome";
import { NeuronType } from "@/simulation/creature/brain/Neuron";
import GreatestMassSelection from "@/simulation/generations/selection/GreatestMassSelection";
import PlantHerbivorePopulation from "@/simulation/generations/population/PlantHerbivorePopulation";

/*
 * Settings the tests start from: the startup scenario with the changes the tests rely on.
 * A small world, metabolism off and free, big brains, every sensor and action enabled.
 * Tests that need other values copy this object and change them.
 */
export const TEST_SIMULATION_DATA : SimulationData = {
  constants: {
    ...startup.constants,
    POPULATION_DEFAULT_SPECIES: [
      {name: "random-random attack_plant", genome: [Genome.connectionToGene({sourceType: NeuronType.SENSOR, sourceId: 4, sinkType: NeuronType.ACTION, sinkId: 4, weight: 1})]},
    ],
    POPULATION_DEFAULT_GENUS: DEFAULT_GENUS_PROBABILITIES.map((item) => ({ ...item })),
  },
  worldControllerData: {
    ...startup.worldControllerData,
    size: 50,
    MASS_AT_BIRTH_ATTACK_PLANT: 2,
    MASS_AT_BIRTH_ATTACK: 2,
    MASS_AT_BIRTH_ATTACK_ANIMAL: 3,
    MASS_MAX_MULTIPLE_MASS_AT_BIRT: 10,
    MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE: 0,
    MOVE_COST_PER_MASS_TRY: 0,
    MOVE_COST_PER_MASS_DO: 0,
    MOVE_MULTIPLE_MASS_AT_BIRTH: 1,
    simCode: "XXX",
    currentGen: 0,
  },
  worldGenerationsData: {
    ...startup.worldGenerationsData,
    populationStrategy: new PlantHerbivorePopulation(),
    selectionMethod: new GreatestMassSelection(),
    initialPopulation: 500,
    maxGenomeSize: 20,
    maxNumberNeurons: 15,
    mutationProbability: 0.25,
    geneInsertionDeletionProbability: 0.1,
    enabledSensors: [
      "HorizontalPosition", "VerticalPosition", "Age", "Oscillator", "Random",
      "HorizontalSpeed", "VerticalSpeed", "HorizontalBorderDistance", "VerticalBorderDistance", "BorderDistance",
      "TouchNorth", "TouchEast", "TouchSouth", "TouchWest", "Pain", "PopulationDensity", "Mass",
      "PreyDistance", "PreyNorth", "PreyEast", "PreySouth", "PreyWest",
      // PredatorDistance and PredatorDirection are not implemented yet
    ],
    enabledActions: [
      "MoveNorth", "MoveSouth", "MoveEast", "MoveWest", "RandomMove", "MoveForward",
      "Photosynthesis", "Reproduction", "AttackPlant", "AttackAnimal",
    ],
    plantGenes: [...startup.worldGenerationsData.plantGenes],
    phenotypeColorMode: "trophicLevel",
  },
  waterData: {
    ...startup.waterData,
    waterFirstRainPerCell: 10,
    waterCellCapacity: 20,
    waterRainMaxPerCell: 2,
    waterTotalPerCell: 20,
  },
  // the bottom of the map divided in 5 columns
  worldObjects: [
    new RectangleObject(0.1, 0.6, 0.04, 0.4),
    new RectangleObject(0.3, 0.6, 0.04, 0.4),
    new RectangleObject(0.5, 0.6, 0.04, 0.4),
    new RectangleObject(0.7, 0.6, 0.04, 0.4),
    new RectangleObject(0.9, 0.6, 0.04, 0.4),
  ],
};
