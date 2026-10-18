import type Creature from "../../Creature";
import { NeuronType } from "../Neuron";

const getPrettyName = (name: string) => name.replace(/([A-Z])/g, " $1").trim();

// Names of the network inputs and outputs, in the same order the network uses:
// one entry per neuron of every enabled sensor, and one per enabled action
export function getNetworkLabels(creature: Creature): { sensors: string[]; actions: string[] } {
  const sensors: string[] = [];
  for (const { enabled, name, neuronCount } of Object.values(creature.brain.sensors.data)) {
    if (!enabled) continue;
    for (let i = 0; i < neuronCount; i++) {
      // sensors with more than one output get a number
      sensors.push(neuronCount > 1 ? `${getPrettyName(name)} [${i + 1}]` : getPrettyName(name));
    }
  }

  const actions: string[] = [];
  for (const { enabled, name } of Object.values(creature.brain.actions.data)) {
    if (enabled) actions.push(getPrettyName(name));
  }

  return { sensors, actions };
}

// Sensors and actions that the creature's network uses: the ones with at least one connection,
// as the network diagram shows them. Returned by pretty name, without the [n] of each neuron
export function getUsedSensorsAndActions(creature: Creature): { sensors: Set<string>; actions: Set<string> } {
  const sensorNames: string[] = [];
  for (const { enabled, name, neuronCount } of Object.values(creature.brain.sensors.data)) {
    if (!enabled) continue;
    for (let i = 0; i < neuronCount; i++) sensorNames.push(getPrettyName(name));
  }
  const actionNames = getNetworkLabels(creature).actions;

  const sensors = new Set<string>();
  const actions = new Set<string>();
  for (const connection of creature.brain.brain.connections) {
    if (connection.sourceType === NeuronType.SENSOR) sensors.add(sensorNames[connection.sourceId]);
    if (connection.sinkType === NeuronType.ACTION) actions.add(actionNames[connection.sinkId]);
  }
  return { sensors, actions };
}

// Pretty names of every enabled sensor and action, in table order
export function getEnabledSensorAndActionNames(creature: Creature): { sensors: string[]; actions: string[] } {
  const pick = (data: Record<string, { enabled: boolean; name: string }>) =>
    Object.values(data).filter(({ enabled }) => enabled).map(({ name }) => getPrettyName(name));
  return { sensors: pick(creature.brain.sensors.data), actions: pick(creature.brain.actions.data) };
}
