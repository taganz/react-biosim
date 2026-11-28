import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";
import DefaultSpeciesPopulation from "@/simulation/generations/population/DefaultSpeciesPopulation";
import { populationStrategyFormatter } from "@/simulation/generations/population/populationStrategyFormatter";
import RectangleSpawnArea from "@/simulation/world/areas/spawn/RectangleSpawnArea";
import Genome from "@/simulation/creature/brain/Genome";
import { NeuronType } from "@/simulation/creature/brain/Neuron";
import { setSeed } from "@/simulation/helpers/random";

const gene = (sourceId: number, sinkId: number, weight: number) =>
  Genome.connectionToGene({ sourceType: NeuronType.SENSOR, sourceId, sinkType: NeuronType.ACTION, sinkId, weight });

const SPECIES = [
  { name: "a", genome: [gene(0, 0, 1), gene(1, 1, -1)] },
  { name: "b", genome: [gene(2, 0, 0.5)] },
  { name: "c", genome: [gene(3, 1, 2), gene(0, 1, 1), gene(1, 0, -2)] },
];

function newWorld(species: typeof SPECIES, withAreas = false, initialPopulation = 10): WorldController {
  const simulationData: SimulationData = {
    ...TEST_SIMULATION_DATA,
    constants: { ...TEST_SIMULATION_DATA.constants, POPULATION_DEFAULT_SPECIES: species },
    worldControllerData: { ...TEST_SIMULATION_DATA.worldControllerData, size: 40 },
    worldGenerationsData: {
      ...TEST_SIMULATION_DATA.worldGenerationsData,
      populationStrategy: new DefaultSpeciesPopulation(),
      initialPopulation,
    },
    worldObjects: withAreas
      ? [new RectangleSpawnArea(0, 0, 0.5, 0.25), new RectangleSpawnArea(0.75, 0.75, 0.25, 0.25)]
      : [],
  };
  const worldController = new WorldController(simulationData);
  worldController.currentGen = 1;
  return worldController;
}

// the genes a creature got from its species (a Stamina gene may be added after them)
const speciesOf = (genes: number[]) =>
  SPECIES.findIndex(({ genome }) => genome.every((g, i) => genes[i] === g));

describe('DefaultSpeciesPopulation', () => {

  beforeEach(() => setSeed(1234));

  test('is saved by its class name', () => {
    const strategy = new DefaultSpeciesPopulation();
    expect(populationStrategyFormatter.serialize(strategy)).toBe("DefaultSpeciesPopulation");
    expect(populationStrategyFormatter.deserialize("DefaultSpeciesPopulation")).toEqual(strategy);
  });

  test.each([false, true])('generation 1 is made of the species in equal shares (spawn areas: %s)', (withAreas) => {
    const worldController = newWorld(SPECIES, withAreas);
    const generations = worldController.generations;
    generations.populationStrategy.populate(generations);
    const creatures = generations.currentCreatures;
    expect(creatures.length).toBe(10);
    const counts = [0, 0, 0];
    for (const creature of creatures) {
      const index = speciesOf(creature.brain.genome.genes);
      expect(index).toBeGreaterThanOrEqual(0);
      counts[index]++;
    }
    expect(counts).toEqual([4, 3, 3]);
    if (withAreas) {
      expect(creatures.every((creature) => creature.spawnZone !== null)).toBe(true);
    }
  });

  test('the genomes are copies: changing one does not change the list', () => {
    const worldController = newWorld(SPECIES);
    const generations = worldController.generations;
    generations.populationStrategy.populate(generations);
    generations.currentCreatures[0].brain.genome.genes[0] = 0;
    expect(SPECIES[0].genome[0]).toBe(gene(0, 0, 1));
  });

  test('with an empty list, generation 1 gets random genomes', () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const worldController = newWorld([]);
    const generations = worldController.generations;
    generations.populationStrategy.populate(generations);
    expect(generations.currentCreatures.length).toBe(10);
    expect(generations.currentCreatures[0].brain.genome.genes.length).toBeGreaterThanOrEqual(
      worldController.simData.worldGenerationsData.initialGenomeSize
    );
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
