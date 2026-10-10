import type Creature from "../../Creature";

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
