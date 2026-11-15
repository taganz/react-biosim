// Comments from https://github.com/davidrmiller/biosim4/blob/main/src/feedForward.cpp

import { rationalTanh } from "../../helpers/helpers";
import Connection from "./Connection";
import Neuron, { NeuronType } from "./Neuron";

// connections packed 3 numbers each: source, sink id, weight. The source is the sensor id,
// or -1 - the neuron id for a connection from a neuron
const STRIDE = 3;

function packConnections(connections: Connection[]): number[] {
  const packed: number[] = [];
  for (const connection of connections) {
    packed.push(
      connection.sourceType === NeuronType.SENSOR ? connection.sourceId : -1 - connection.sourceId,
      connection.sinkId,
      connection.weight
    );
  }
  return packed;
}

export class Network {
  outputs: number[] = [];
  neuronAccumulators: number[] = [];  // neurons stores value for next step
  // sensor values of the last step, kept so the UI can show the network activity
  inputs: number[] = [];

  // feedForward runs for every creature at every step, so the connections are compiled once
  // into flat arrays. `connections` stays as it is for the UI and CreatureGenus.
  // Plain arrays: brains have few connections, and typed arrays were not faster.
  // The connections before the first connection to an action (all of them go to neurons)
  private toNeurons: number[];
  // The connections to actions from the first one on. Connections to neurons found after it
  // are left out: their sums were reset before anything read them
  private toActions: number[];
  // the neuron outputs are only latched when there is a connection to an action
  private hasActionConnections: boolean;

  constructor(
    public inputCount: number,
    public outputCount: number,
    public neurons: Neuron[],
    public connections: Connection[]
  ) {
    this.outputs = Array(this.outputCount).fill(0);
    this.neuronAccumulators = Array(this.neurons.length).fill(0);

    let firstAction = connections.findIndex((connection) => connection.sinkType === NeuronType.ACTION);
    this.hasActionConnections = firstAction >= 0;
    if (firstAction < 0) firstAction = connections.length;
    this.toNeurons = packConnections(connections.slice(0, firstAction));
    this.toActions = packConnections(
      connections.slice(firstAction).filter((connection) => connection.sinkType === NeuronType.ACTION));
  }

  feedForward(inputs: number[]): number[] {
    // sensors create a new array every step, so keeping the reference is enough
    this.inputs = inputs;
    const outputs = this.outputs;
    const accumulators = this.neuronAccumulators;
    const neurons = this.neurons;

    // This container is used to return values for all the action outputs. This array
    // contains one value per action neuron, which is the sum of all its weighted
    // input connections. The sum has an arbitrary range. 
    for (let i = 0; i < outputs.length; i++) {
      outputs[i] = 0;
    }

    // Weighted inputs to each neuron are summed in neuronAccumulators[]
    for (let i = 0; i < accumulators.length; i++) {
      accumulators[i] = 0;
    }

    // Connections were ordered at birth so that all connections to neurons get
    // processed here before any connections to actions. The connection's input value
    // comes from a sensor or from another neuron (its output of the previous step).
    // The values are summed for now, later passed through a transfer function
    const toNeurons = this.toNeurons;
    for (let c = 0; c < toNeurons.length; c += STRIDE) {
      const source = toNeurons[c];
      const inputValue = source >= 0 ? inputs[source] : neurons[-1 - source].output;
      accumulators[toNeurons[c + 1]] += inputValue * toNeurons[c + 2];
    }

    if (this.hasActionConnections) {
      // We've handled all the connections from sensors and now we are about to
      // start on the connections to the action outputs, so now it's time to
      // update and latch all the neuron outputs to their proper range (-1.0..1.0),
      // except for undriven neurons which act as bias feeds and don't change.
      for (let neuronIdx = 0; neuronIdx < neurons.length; neuronIdx++) {
        const neuron = neurons[neuronIdx];
        if (neuron.driven) {
          neuron.output = rationalTanh(accumulators[neuronIdx]);
        }
      }

      // Weight the connection's value and add to the action accumulator, in an arbitrary range
      const toActions = this.toActions;
      for (let c = 0; c < toActions.length; c += STRIDE) {
        const source = toActions[c];
        const inputValue = source >= 0 ? inputs[source] : neurons[-1 - source].output;
        outputs[toActions[c + 1]] += inputValue * toActions[c + 2];
      }
    }

    for (let i = 0; i < outputs.length; i++) {
      outputs[i] = rationalTanh(outputs[i]);
    }

    return outputs;
  }

  get totalNeurons(): number {
    return this.inputCount + this.outputCount + this.neurons.length;
  }

  get totalInternalNeurons(): number {
    return this.neurons.length;
  }
}
