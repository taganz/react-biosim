import { Gene } from "./Genome";
import { Network } from "./Network";
import Connection, { ConnectionType } from "./Connection";
import Neuron, { NeuronType } from "./Neuron";
import NeuronNode from "./NeuronNode";

export const initialNeuronOutput = 0.5;

/** the numbers a gene is decoded with: ids are taken modulo these */
export type GeneCounts = {
  /** sensor neurons of the network: the enabled sensors */
  sensorCount: number;
  /** enabled actions */
  actionCount: number;
  /** Max neurons */
  maxNeurons: number;
};

/** a gene as a connection; the ids are positions in the enabled lists or neuron numbers */
export function decodeGene(gene: Gene, counts: GeneCounts): ConnectionType {
  const connection = {
    sourceType: (gene >> 31) & 1,
    sourceId: (gene >> 24) & 127,
    sinkType: (gene >> 23) & 1,
    sinkId: (gene >> 16) & 127,
    weight: (gene & 65535) / 8192 - 4,
  };
  // Renumber the ids: from a random number to one of the available options
  connection.sourceId %= connection.sourceType === NeuronType.SENSOR ? counts.sensorCount : counts.maxNeurons;
  connection.sinkId %= connection.sinkType === NeuronType.ACTION ? counts.actionCount : counts.maxNeurons;
  return connection;
}

export type BuiltNetwork = {
  network: Network;
  /** weight of the first Stamina gene, null if there is none */
  staminaWeight: number | null;
  /** positions in the genome of the genes that drive the Stamina action */
  staminaGeneIndexes: number[];
  /** for each connection of the network, the position in the genome of its gene */
  connectionGeneIndexes: number[];
  /** for each neuron of the network, its number in the genes (before renumbering) */
  neuronGeneIds: number[];
};

/**
 * The network a genome builds, as a creature builds its brain at birth: genes become
 * connections, Stamina genes are left out, neurons without outputs (or that only feed
 * themselves) are deleted with their inputs, and the neurons left are renumbered from 0.
 * staminaId is the enabled id of the Stamina action, or -1 when it is not enabled.
 */
export function buildNetworkFromGenes(genes: readonly Gene[], counts: GeneCounts, staminaId: number): BuiltNetwork {
  // Create connections from genes, with the position of each gene
  const connections: Connection[] = [];
  const geneIndexes: number[] = [];
  // Stamina genes are not connections: the first one gives the stamina and all are left out
  let staminaWeight: number | null = null;
  const staminaGeneIndexes: number[] = [];
  for (let geneIdx = 0; geneIdx < genes.length; geneIdx++) {
    const connection = decodeGene(genes[geneIdx], counts);
    if (connection.sinkType === NeuronType.ACTION && connection.sinkId === staminaId) {
      if (staminaWeight === null) staminaWeight = connection.weight;
      staminaGeneIndexes.push(geneIdx);
      continue;
    }
    connections.push(new Connection(connection.sourceType, connection.sourceId,
      connection.sinkType, connection.sinkId, connection.weight));
    geneIndexes.push(geneIdx);
  }

  // Build a map of neurons. We won't include sensor or action neurons
  const nodeMap: Map<number, NeuronNode> = new Map();
  for (const connection of connections) {
    if (connection.sinkType === NeuronType.NEURON) {
      let node = nodeMap.get(connection.sinkId);
      if (!node) {
        node = new NeuronNode();
        nodeMap.set(connection.sinkId, node);
      }
      if (connection.sourceType == NeuronType.NEURON && connection.sourceId == connection.sinkId) {
        node.numSelfInputs++;
      } else {
        node.numInputsFromSensorsOrOtherNeurons++;
      }
    }

    if (connection.sourceType === NeuronType.NEURON) {
      let node = nodeMap.get(connection.sourceId);
      if (!node) {
        node = new NeuronNode();
        nodeMap.set(connection.sourceId, node);
      }
      node.numOutputs++;
    }
  }

  // Delete useless neurons
  let allDone = false;
  while (!allDone) {
    allDone = true;
    for (const [id, neuronNode] of nodeMap) {
      // Look for neurons with zero outputs, or neurons that only feed itself
      if (neuronNode.numOutputs === neuronNode.numSelfInputs) {
        allDone = false;
        // Find and remove connections from sensors or other neurons
        for (let connectionIdx = connections.length - 1; connectionIdx >= 0; connectionIdx--) {
          const connection = connections[connectionIdx];
          if (connection.sinkType == NeuronType.NEURON && connection.sinkId == id) {
            // See if there's a neuron sourcing this connection
            if (connection.sourceType == NeuronType.NEURON) {
              // Decrement the neuron's numOutputs:
              (<NeuronNode>nodeMap.get(connection.sourceId)).numOutputs--;
            }
            // Remove the connection
            connections.splice(connectionIdx, 1);
            geneIndexes.splice(connectionIdx, 1);
          }
        }
        // Remove the neuron
        nodeMap.delete(id);
      }
    }
  }

  // Renumber neurons in nodeMap
  let newIndex = 0;
  const neuronGeneIds: number[] = [];
  for (const [id, neuronNode] of nodeMap) {
    neuronNode.remappedIndex = newIndex;
    neuronGeneIds.push(id);
    newIndex++;
  }

  // Create final array of connections. We want to add first the connections between
  // sensors and neurons, and between neurons and neurons, then the connections with actions
  const finalConnections: Connection[] = [];
  const connectionGeneIndexes: number[] = [];
  for (const toNeurons of [true, false]) {
    for (let connectionIdx = 0; connectionIdx < connections.length; connectionIdx++) {
      const connection = connections[connectionIdx];
      if ((connection.sinkType === NeuronType.NEURON) !== toNeurons) continue;
      const newConnection = connection.copy();
      if (toNeurons) {
        // Use the new index for the sink neuron
        newConnection.sinkId = (<NeuronNode>nodeMap.get(connection.sinkId)).remappedIndex;
      }
      if (newConnection.sourceType === NeuronType.NEURON) {
        // Use the new index for the source neuron
        newConnection.sourceId = (<NeuronNode>nodeMap.get(connection.sourceId)).remappedIndex;
      }
      finalConnections.push(newConnection);
      connectionGeneIndexes.push(geneIndexes[connectionIdx]);
    }
  }

  // Create final array of neurons
  const finalNeurons: Neuron[] = [];
  for (const [_id, neuronNode] of nodeMap) {
    finalNeurons.push(new Neuron(initialNeuronOutput, neuronNode.numInputsFromSensorsOrOtherNeurons !== 0));
  }

  return {
    network: new Network(counts.sensorCount, counts.actionCount, finalNeurons, finalConnections),
    staminaWeight,
    staminaGeneIndexes,
    connectionGeneIndexes,
    neuronGeneIds,
  };
}
