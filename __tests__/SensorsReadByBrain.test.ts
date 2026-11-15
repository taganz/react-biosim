import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";
import AsexualRandomPopulation from "@/simulation/generations/population/AsexualRandomPopulation";
import Genome from "@/simulation/creature/brain/Genome";
import Connection from "@/simulation/creature/brain/Connection";
import { NeuronType } from "@/simulation/creature/brain/Neuron";
import { getRandomState, setRandomState } from "@/simulation/helpers/random";
import Creature from "@/simulation/creature/Creature";

// The brain computes only the sensors its final connections read, into a buffer of its own
describe("sensors read by the brain", () => {
  let worldController: WorldController;

  beforeEach(() => {
    // WorldController schedules with window.setTimeout
    (globalThis as any).window = globalThis;
    // random genomes with every sensor enabled, so the brains read all kinds of sensors
    const simulationData: SimulationData = {
      ...TEST_SIMULATION_DATA,
      worldObjects: [],
      worldControllerData: { ...TEST_SIMULATION_DATA.worldControllerData, size: 30, seed: 11 },
      worldGenerationsData: {
        ...TEST_SIMULATION_DATA.worldGenerationsData,
        populationStrategy: new AsexualRandomPopulation(),
        initialPopulation: 200,
      },
    };
    worldController = new WorldController(simulationData);
    worldController.startRun(simulationData);
    worldController.pause();
    for (let i = 0; i < 5; i++) worldController.generations.step();
  });

  const readIds = (creature: Creature) => Array.from(new Set(creature.brain.brain.connections
    .filter((connection) => connection.sourceType === NeuronType.SENSOR)
    .map((connection) => connection.sourceId))).sort((a, b) => a - b);

  test("readSensorIds lists the sensors of the connections once, in ascending order", () => {
    const sensors = worldController.generations.sensors;
    const connections = [
      new Connection(NeuronType.SENSOR, 5, NeuronType.ACTION, 0, 1),
      new Connection(NeuronType.NEURON, 2, NeuronType.ACTION, 0, 1),
      new Connection(NeuronType.SENSOR, 1, NeuronType.NEURON, 0, 1),
      new Connection(NeuronType.SENSOR, 5, NeuronType.NEURON, 0, -1),
    ];
    expect(sensors.readSensorIds(connections)).toEqual([1, 5]);
    expect(sensors.readSensorIds([])).toEqual([]);
  });

  test("a sensor the brain reads gets the same value as computing every sensor", () => {
    const sensors = worldController.generations.sensors;
    const randomId = sensors.sensorNameToId("Random");
    const creatures = worldController.generations.currentCreatures;
    expect(creatures.length).toBeGreaterThan(50);
    const kindsRead = new Set<number>();

    for (const creature of creatures) {
      const ids = creature.brain.sensorIds;
      expect(ids).toEqual(readIds(creature));
      ids.forEach((id) => kindsRead.add(id));

      // the same random state for both, so the Random sensor draws the same number
      const state = getRandomState();
      const all = sensors.calculateOutputs(creature);
      const stateAfterAll = getRandomState();
      setRandomState(state);
      const values = Array(sensors.neuronsCount).fill(0);
      sensors.writeOutputs(creature, ids, values);

      // only the Random sensor draws, and only when it is read
      if (ids.includes(randomId)) expect(getRandomState()).toBe(stateAfterAll);
      else expect(getRandomState()).toBe(state);
      setRandomState(stateAfterAll);

      for (let id = 0; id < values.length; id++) {
        expect(values[id]).toBe(ids.includes(id) ? all[id] : 0);
      }
    }
    // the population reads most kinds of sensor
    expect(kindsRead.size).toBeGreaterThan(sensors.neuronsCount / 2);
  });

  test("the network outputs are the same as with every sensor computed", () => {
    const sensors = worldController.generations.sensors;
    for (const creature of worldController.generations.currentCreatures) {
      const network = creature.brain.brain;
      const neuronOutputs = network.neurons.map((neuron) => neuron.output);

      const state = getRandomState();
      const all = sensors.calculateOutputs(creature);
      setRandomState(state);
      const expected = [...network.feedForward(all)];

      network.neurons.forEach((neuron, index) => { neuron.output = neuronOutputs[index]; });
      sensors.writeOutputs(creature, creature.brain.sensorIds, network.inputs);
      expect(network.feedForward(network.inputs)).toEqual(expected);
    }
  });

  test("each creature keeps the sensor values of its own last step", () => {
    const sensors = worldController.generations.sensors;
    const creatures = worldController.generations.currentCreatures;
    // the inputs are not shared between networks
    expect(new Set(creatures.map((creature) => creature.brain.brain.inputs)).size).toBe(creatures.length);

    // a creature that reads a position sensor, which other creatures see with other values
    const xId = sensors.sensorNameToId("HorizontalPosition");
    const selected = creatures.find((creature) => creature.brain.sensorIds.includes(xId))!;
    expect(selected).toBeDefined();
    worldController.generations.step();
    expect(selected.isAlive).toBe(true);
    // the position before the move of its last step
    expect(selected.brain.brain.inputs[xId]).toBe(selected.lastPosition[0] / worldController.grid.size);
    // unread sensors stay 0
    for (let id = 0; id < sensors.neuronsCount; id++) {
      if (!selected.brain.sensorIds.includes(id)) expect(selected.brain.brain.inputs[id]).toBe(0);
    }
  });

  test("a brain without connections reads no sensor", () => {
    const creature = worldController.generations.newCreature([0, 0], true, new Genome([]));
    expect(creature.brain.brain.connections).toHaveLength(0);
    expect(creature.brain.sensorIds).toEqual([]);
  });
});
