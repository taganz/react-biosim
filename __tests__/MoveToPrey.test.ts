import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";
import Genome from "@/simulation/creature/brain/Genome";
import { NeuronType } from "@/simulation/creature/brain/Neuron";
import { ActionName } from "@/simulation/creature/brain/CreatureActions";
import { SensorName } from "@/simulation/creature/brain/CreatureSensors";
import CreatureSensors from "@/simulation/creature/brain/CreatureSensors";
import Creature from "@/simulation/creature/Creature";
import { GridPosition } from "@/simulation/world/grid/Grid";

const SENSORS: SensorName[] = ["HorizontalPosition", "PreyNorth", "PreyProximity"];
const ACTIONS: ActionName[] = ["MoveEast", "Photosynthesis", "Attack", "MoveToPrey"];

function makeWorld(radius = 5): WorldController {
  const simulationData: SimulationData = {
    ...TEST_SIMULATION_DATA,
    constants: { ...TEST_SIMULATION_DATA.constants, DETECT_RADIUS: radius },
    worldObjects: [],
    worldControllerData: { ...TEST_SIMULATION_DATA.worldControllerData, size: 10 },
    worldGenerationsData: {
      ...TEST_SIMULATION_DATA.worldGenerationsData,
      enabledSensors: [...SENSORS],
      enabledActions: [...ACTIONS],
      metabolismEnabled: false,
      initialPopulation: 0,
    },
  };
  return new WorldController(simulationData);
}

// a gene from a sensor to an action, with this weight
function gene(world: WorldController, sensor: SensorName, action: ActionName, weight: number): number {
  return Genome.connectionToGene({
    sourceType: NeuronType.SENSOR, sourceId: world.generations.sensors.sensorNameToId(sensor),
    sinkType: NeuronType.ACTION, sinkId: world.generations.actions.actionNameToId(action), weight,
  });
}

function plant(world: WorldController, position: GridPosition): Creature {
  return world.generations.newCreature(position, true,
    new Genome([gene(world, "HorizontalPosition", "Photosynthesis", 1)]))!;
}

// a herbivore whose brain drives MoveToPrey from HorizontalPosition (positive away from x = 0)
function hunter(world: WorldController, position: GridPosition, extraGenes: number[] = []): Creature {
  return world.generations.newCreature(position, true, new Genome([
    gene(world, "HorizontalPosition", "Attack", 1),
    gene(world, "HorizontalPosition", "MoveToPrey", 3),
    ...extraGenes,
  ]))!;
}

// the urge MoveToPrey adds with output 1, from the prey found now
function urgeTowardsPrey(creature: Creature): [number, number] {
  creature.urgeToMove[0] = 0;
  creature.urgeToMove[1] = 0;
  creature.brain.sensedPrey = CreatureSensors.searchPrey(creature);
  creature.moveToPrey(1);
  return [creature.urgeToMove[0], creature.urgeToMove[1]];
}

describe("PreyProximity sensor", () => {
  function proximity(world: WorldController, creature: Creature): number {
    const sensors = world.generations.sensors;
    return sensors.calculateOutputs(creature)[sensors.sensorNameToId("PreyProximity")];
  }

  test("is 1 next to the prey, 1 / DETECT_RADIUS at the edge of the radius and 0 without prey", () => {
    const world = makeWorld(5);
    const herbivore = hunter(world, [1, 1]);
    expect(proximity(world, herbivore)).toBe(0);
    const far = plant(world, [6, 3]);   // distance 5
    expect(proximity(world, herbivore)).toBeCloseTo(0.2);
    plant(world, [3, 3]);               // distance 2
    expect(proximity(world, herbivore)).toBeCloseTo(0.8);
    plant(world, [2, 2]);               // diagonal neighbour, distance 1
    expect(proximity(world, herbivore)).toBe(1);
    expect(far.isAlive).toBe(true);
  });

  test("counts as a prey sensor, so a brain that reads it searches the prey", () => {
    const world = makeWorld();
    const herbivore = world.generations.newCreature([1, 1], true, new Genome([
      gene(world, "PreyProximity", "Attack", 1),
    ]))!;
    expect(herbivore.brain.usesPreySensors).toBe(true);
    expect(herbivore.brain.usesPreySearch).toBe(true);
  });
});

describe("MoveToPrey action", () => {
  test("urges towards a prey that is further than one cell, on both axes", () => {
    const world = makeWorld();
    const herbivore = hunter(world, [5, 5]);
    plant(world, [2, 8]);
    expect(urgeTowardsPrey(herbivore)).toEqual([-1, 1]);
  });

  test("urges on one axis when the prey is in line", () => {
    const world = makeWorld();
    const herbivore = hunter(world, [5, 5]);
    plant(world, [5, 2]);
    expect(urgeTowardsPrey(herbivore)).toEqual([0, -1]);
  });

  test("adds no urge without prey or next to it (N, E, S or W), where it can attack", () => {
    const world = makeWorld();
    const herbivore = hunter(world, [5, 5]);
    expect(urgeTowardsPrey(herbivore)).toEqual([0, 0]);
    plant(world, [6, 5]);
    expect(urgeTowardsPrey(herbivore)).toEqual([0, 0]);
  });

  test("with the prey in a diagonal neighbour, moves on one axis to a free cell, horizontally first", () => {
    const world = makeWorld();
    const herbivore = hunter(world, [5, 5]);
    plant(world, [6, 6]);
    expect(urgeTowardsPrey(herbivore)).toEqual([1, 0]);
    // the cell to the east is taken by a creature that is not prey: vertically
    hunter(world, [6, 5]);
    expect(urgeTowardsPrey(herbivore)).toEqual([0, 1]);
    // both cells taken: no urge
    hunter(world, [5, 6]);
    expect(urgeTowardsPrey(herbivore)).toEqual([0, 0]);
  });

  test("the brain searches the prey for MoveToPrey without prey sensors, and the creature moves towards it", () => {
    const world = makeWorld();
    const herbivore = hunter(world, [5, 5]);
    plant(world, [5, 2]);
    expect(herbivore.brain.usesPreySensors).toBe(false);
    expect(herbivore.brain.usesPreySearch).toBe(true);
    herbivore.urgeToMove[0] = 0;
    herbivore.urgeToMove[1] = 0;
    herbivore.brain.step();
    expect(herbivore.brain.sensedPrey?.position).toEqual([5, 2]);
    expect(herbivore.urgeToMove[0]).toBe(0);
    expect(herbivore.urgeToMove[1]).toBeLessThan(0);
  });

  test("a brain not connected to MoveToPrey and without prey sensors does not search", () => {
    const world = makeWorld();
    const herbivore = world.generations.newCreature([5, 5], true, new Genome([
      gene(world, "HorizontalPosition", "Attack", 1),
    ]))!;
    plant(world, [5, 2]);
    herbivore.brain.step();
    expect(herbivore.brain.usesPreySearch).toBe(false);
    expect(herbivore.brain.sensedPrey).toBeNull();
  });
});
