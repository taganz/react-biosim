import WorldController from "@/simulation/world/WorldController";
import { Network } from "@/simulation/creature/brain/Network";
import Neuron, { NeuronType } from "@/simulation/creature/brain/Neuron";
import Connection from "@/simulation/creature/brain/Connection";
import {
  getEnabledSensorAndActionNames,
  getNetworkLabels,
  getUsedSensorsAndActions,
} from "@/simulation/creature/brain/Helpers/networkLabels";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";

const { SENSOR, ACTION, NEURON } = NeuronType;

describe("getUsedSensorsAndActions", () => {
  const simulationData = structuredClone(TEST_SIMULATION_DATA);
  simulationData.worldObjects = [];
  simulationData.worldControllerData.size = 5;
  simulationData.worldGenerationsData.initialPopulation = 1;
  const worldController = new WorldController(simulationData);
  const creature = worldController.generations.newCreature([1, 1], true);
  const labels = getNetworkLabels(creature);
  const brain = creature.brain;

  test("returns the names of the connected sensors and actions", () => {
    brain.brain = new Network(
      brain._networkInputCount,
      brain._networkOutputCount,
      [new Neuron(0.5, true)],
      [
        new Connection(SENSOR, 0, NEURON, 0, 1),
        new Connection(NEURON, 0, ACTION, 1, 1),
        new Connection(SENSOR, 2, ACTION, 1, 1),
      ]
    );
    const used = getUsedSensorsAndActions(creature);
    expect(used.sensors).toEqual(new Set([labels.sensors[0], labels.sensors[2]]));
    expect(used.actions).toEqual(new Set([labels.actions[1]]));
  });

  test("returns empty sets for a network without connections", () => {
    brain.brain = new Network(brain._networkInputCount, brain._networkOutputCount, [], []);
    const used = getUsedSensorsAndActions(creature);
    expect(used.sensors.size).toBe(0);
    expect(used.actions.size).toBe(0);
  });

  test("lists each enabled sensor once, even with several neurons", () => {
    const names = getEnabledSensorAndActionNames(creature);
    expect(new Set(names.sensors).size).toBe(names.sensors.length);
    expect(names.actions).toEqual(labels.actions);
    for (const label of labels.sensors) {
      expect(names.sensors).toContain(label.replace(/ \[\d+\]$/, ""));
    }
  });
});
