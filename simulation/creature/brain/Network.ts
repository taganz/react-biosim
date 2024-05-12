// Comments from https://github.com/davidrmiller/biosim4/blob/main/src/feedForward.cpp

import { rationalTanh } from "../../helpers/helpers";
import Connection from "./Connection";
import Neuron, { NeuronType } from "./Neuron";

export class Network {
  outputs: number[] = [];
  neuronAccumulators: number[] = [];  // neurons stores value for next step

  constructor(
    public inputCount: number,
    public outputCount: number,
    public neurons: Neuron[],
    public connections: Connection[]
  ) {
    this.outputs = Array(this.outputCount).fill(0);
    this.neuronAccumulators = Array(this.neurons.length).fill(0);
  }

  feedForward(inputs: number[]): number[] {
    
    // This container is used to return values for all the action outputs. This array
    // contains one value per action neuron, which is the sum of all its weighted
    // input connections. The sum has an arbitrary range. 
    for (let i = 0; i < this.outputs.length; i++) {
      this.outputs[i] = 0;
    }

    // Weighted inputs to each neuron are summed in neuronAccumulators[]
    for (let i = 0; i < this.neuronAccumulators.length; i++) {
      this.neuronAccumulators[i] = 0;
    }

    // Connections were ordered at birth so that all connections to neurons get
    // processed here before any connections to actions. As soon as we encounter the
    // first connection to an action, we'll pass all the neuron input accumulators
    // through a transfer function and update the neuron outputs in the indiv,
    // except for undriven neurons which act as bias feeds and don't change. The
    // transfer function will leave each neuron's output in the range -1.0..1.0.
    let neuronOutputsComputed = false;

    // for all connections
    for (
      let connectionIdx = 0;
      connectionIdx < this.connections.length;
      connectionIdx++
    ) {
      const connection = this.connections[connectionIdx];

      if (connection.sinkType == NeuronType.ACTION && !neuronOutputsComputed) {
        // We've handled all the connections from sensors and now we are about to
        // start on the connections to the action outputs, so now it's time to
        // update and latch all the neuron outputs to their proper range (-1.0..1.0)
        for (let neuronIdx = 0; neuronIdx < this.neurons.length; neuronIdx++) {
          const neuron = this.neurons[neuronIdx];
          if (neuron.driven) {
            neuron.output = rationalTanh(this.neuronAccumulators[neuronIdx]);
          }
        }
        neuronOutputsComputed = true;
      }

      // Obtain the connection's input value from a sensor neuron or other neuron
      // The values are summed for now, later passed through a transfer function
      let inputValue;
      if (connection.sourceType === NeuronType.SENSOR) {
        inputValue = inputs[connection.sourceId];
      } else {
        inputValue = this.neurons[connection.sourceId].output;
      }

      // Weight the connection's value and add to neuron accumulator or action accumulator.
      // The action and neuron accumulators will therefore contain +- float values in
      // an arbitrary range.
      if (connection.sinkType === NeuronType.ACTION) {
        this.outputs[connection.sinkId] += inputValue * connection.weight;
      } else {
        this.neuronAccumulators[connection.sinkId] +=
          inputValue * connection.weight;
      }
    }

    for (let i = 0; i < this.outputs.length; i++) {
      this.outputs[i] = rationalTanh(this.outputs[i]);
    }

    return this.outputs;
  }

  get totalNeurons(): number {
    return this.inputCount + this.outputCount + this.neurons.length;
  }

  get totalInternalNeurons(): number {
    return this.neurons.length;
  }
}
