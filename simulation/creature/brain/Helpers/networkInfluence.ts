import { Network } from "../Network";
import { NeuronType } from "../Neuron";

// Where a signal starts: a sensor, or an undriven neuron (no inputs) whose output
// never changes, so it works as a constant bias
export type InfluenceSource =
  | { type: "sensor"; index: number }
  | { type: "constant"; neuron: number };

export type InfluencePath = {
  // internal neurons the signal goes through, in order (empty for a direct connection)
  via: number[];
  // product of the weights along the path (times the neuron output for constant sources)
  value: number;
};

export type Influence = {
  source: InfluenceSource;
  action: number;
  // sum of all paths from source to action
  total: number;
  paths: InfluencePath[];
};

/*
Linear approximation of how much each sensor (or constant neuron) pushes each action:
the sum, over every path from source to action, of the product of the weights.
It ignores the tanh saturation of neurons and actions, and self connections
(a neuron feeding itself) are skipped; paths never visit a neuron twice.
*/
export function computeInfluences(network: Network, constantNeuronOutput: number): Influence[] {
  const fromSensor = new Map<number, typeof network.connections>();
  const fromNeuron = new Map<number, typeof network.connections>();
  for (const connection of network.connections) {
    // sourceType: SENSOR or NEURON
    const map = connection.sourceType === NeuronType.SENSOR ? fromSensor : fromNeuron;
    const list = map.get(connection.sourceId) ?? [];
    list.push(connection);
    map.set(connection.sourceId, list);
  }

  const influences = new Map<string, Influence>();
  const addPath = (source: InfluenceSource, action: number, path: InfluencePath) => {
    const key = `${source.type}:${source.type === "sensor" ? source.index : source.neuron}:${action}`;
    let influence = influences.get(key);
    if (!influence) {
      influence = { source, action, total: 0, paths: [] };
      influences.set(key, influence);
    }
    influence.total += path.value;
    // duplicated genes create parallel connections: merge paths through the same neurons
    const sameRoute = influence.paths.find(
      (existing) => existing.via.length === path.via.length && existing.via.every((n, i) => n === path.via[i])
    );
    if (sameRoute) {
      sameRoute.value += path.value;
    } else {
      influence.paths.push({ ...path });
    }
  };

  const followConnections = (
    source: InfluenceSource,
    connections: typeof network.connections,
    value: number,
    via: number[]
  ) => {
    for (const connection of connections) {
      const weighted = value * connection.weight;
      // sinkType: NEURON or ACTION
      if (connection.sinkType !== NeuronType.NEURON) {
        addPath(source, connection.sinkId, { via, value: weighted });
      } else if (!via.includes(connection.sinkId) && !isConstantStart(source, connection.sinkId)) {
        followConnections(
          source,
          fromNeuron.get(connection.sinkId) ?? [],
          weighted,
          [...via, connection.sinkId]
        );
      }
    }
  };

  // a constant neuron's own id is not in `via`, so don't loop back into it
  const isConstantStart = (source: InfluenceSource, neuron: number) =>
    source.type === "constant" && source.neuron === neuron;

  for (const [sensor, connections] of fromSensor) {
    followConnections({ type: "sensor", index: sensor }, connections, 1, []);
  }

  network.neurons.forEach((neuron, index) => {
    if (!neuron.driven) {
      followConnections(
        { type: "constant", neuron: index },
        fromNeuron.get(index) ?? [],
        constantNeuronOutput,
        []
      );
    }
  });

  return Array.from(influences.values()).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
}
