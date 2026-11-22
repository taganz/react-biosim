import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";
import RectangleSpawnArea from "@/simulation/world/areas/spawn/RectangleSpawnArea";
import AsexualZonePopulation from "@/simulation/generations/population/AsexualZonePopulation";
import { countsByArea, spawnAreas } from "@/simulation/generations/population/spawnZones";
import Creature from "@/simulation/creature/Creature";
import Genome from "@/simulation/creature/brain/Genome";
import { setSeed } from "@/simulation/helpers/random";

// a 40 x 40 world with two spawn areas: 20 x 10 cells at the top left and 10 x 10 at the bottom right.
// With three, a third of 5 x 10 cells at the bottom left
function newWorld(gen: number, three = false): WorldController {
  const simulationData: SimulationData = {
    ...TEST_SIMULATION_DATA,
    worldControllerData: { ...TEST_SIMULATION_DATA.worldControllerData, size: 40 },
    worldGenerationsData: {
      ...TEST_SIMULATION_DATA.worldGenerationsData,
      populationStrategy: new AsexualZonePopulation(),
      initialPopulation: three ? 35 : 30,
    },
    worldObjects: [
      new RectangleSpawnArea(0, 0, 0.5, 0.25),
      new RectangleSpawnArea(0.75, 0.75, 0.25, 0.25),
      ...(three ? [new RectangleSpawnArea(0, 0.75, 0.125, 0.25)] : []),
    ],
  };
  const worldController = new WorldController(simulationData);
  worldController.currentGen = gen;
  return worldController;
}

function zoneCovering(worldController: WorldController, creature: Creature): number {
  const areas = spawnAreas(worldController.grid);
  const objects = worldController.grid.cell(creature.position[0], creature.position[1]).objects;
  return areas.findIndex((area) => objects.includes(area));
}

describe('spawn zones', () => {

  beforeEach(() => setSeed(1234));

  test('countsByArea splits in proportion to the cells, giving the rounding to the largest remainders', () => {
    const area = (cells: number) => ({ pixels: new Array(cells) }) as never;
    expect(countsByArea([area(200), area(100)], 30)).toEqual([20, 10]);
    expect(countsByArea([area(3), area(3), area(3)], 10)).toEqual([4, 3, 3]);
    expect(countsByArea([area(1), area(2)], 10)).toEqual([3, 7]);
    expect(countsByArea([area(0), area(0)], 5)).toEqual([3, 2]);
    expect(countsByArea([], 5)).toEqual([]);
  });

  test('generation 1 is split among the spawn areas in proportion to their size', () => {
    const worldController = newWorld(1);
    worldController.generations.populationStrategy.populate(worldController.generations);
    const creatures = worldController.generations.currentCreatures;
    expect(creatures.length).toBe(30);
    for (const creature of creatures) {
      expect(zoneCovering(worldController, creature)).toBe(creature.spawnZone);
    }
    expect(creatures.filter((c) => c.spawnZone === 0).length).toBe(20);
    expect(creatures.filter((c) => c.spawnZone === 1).length).toBe(10);
  });

  test('children are placed in the spawn area of their parent', () => {
    const first = newWorld(1);
    first.generations.populationStrategy.populate(first.generations);
    const inZone = (zone: number) => first.generations.currentCreatures.filter((c) => c.spawnZone === zone);
    // two survivors from the big area and one from the small one, which end the generation anywhere
    const parents = [inZone(0)[0], inZone(0)[1], inZone(1)[0]];
    parents.forEach((parent, i) => { parent.position = [20 + i, 20]; });

    const second = newWorld(2);
    second.generations.populationStrategy.populate(second.generations, parents);
    const children = second.generations.currentCreatures;
    expect(children.length).toBe(30);
    for (const child of children) {
      const parent = parents.find((p) => p.id === child.parentId)!;
      expect(child.spawnZone).toBe(parent.spawnZone);
      expect(zoneCovering(second, child)).toBe(parent.spawnZone);
    }
    expect(children.filter((c) => c.spawnZone === 1).length).toBe(10);
  });

  test('with three spawn areas, each keeps its share and its lineages', () => {
    const first = newWorld(1, true);
    first.generations.populationStrategy.populate(first.generations);
    const creatures = first.generations.currentCreatures;
    for (const creature of creatures) {
      expect(zoneCovering(first, creature)).toBe(creature.spawnZone);
    }
    expect([0, 1, 2].map((zone) => creatures.filter((c) => c.spawnZone === zone).length)).toEqual([20, 10, 5]);

    // one survivor from each area
    const parents = [0, 1, 2].map((zone) => creatures.find((c) => c.spawnZone === zone)!);
    const second = newWorld(2, true);
    second.generations.populationStrategy.populate(second.generations, parents);
    const children = second.generations.currentCreatures;
    expect(children.length).toBe(35);
    for (const child of children) {
      const parent = parents.find((p) => p.id === child.parentId)!;
      expect(child.spawnZone).toBe(parent.spawnZone);
      expect(zoneCovering(second, child)).toBe(parent.spawnZone);
    }
    expect(new Set(children.map((c) => c.spawnZone))).toEqual(new Set([0, 1, 2]));
  });

  test('a parent without a spawn zone gives its children the zone that covers its cell', () => {
    const first = newWorld(1);
    const parent = first.generations.newCreature([35, 35], true, new Genome([0]));
    expect(parent.spawnZone).toBeNull();

    const second = newWorld(2);
    second.generations.populationStrategy.populate(second.generations, [parent]);
    for (const child of second.generations.currentCreatures) {
      expect(child.spawnZone).toBe(1);
      expect(zoneCovering(second, child)).toBe(1);
    }
  });

  test('restarting a generation from its genomes splits them among the spawn areas', () => {
    const worldController = newWorld(5);
    const genomes = [...new Array(30)].map(() => new Genome([0]));
    worldController.generations.populateWithGenomes(genomes);
    const creatures = worldController.generations.currentCreatures;
    expect(creatures.filter((c) => c.spawnZone === 0 && zoneCovering(worldController, c) === 0).length).toBe(20);
    expect(creatures.filter((c) => c.spawnZone === 1 && zoneCovering(worldController, c) === 1).length).toBe(10);
  });
});
