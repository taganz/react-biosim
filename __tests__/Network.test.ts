import { Network } from "@/simulation/creature/brain/Network";
import Connection from "@/simulation/creature/brain/Connection";
import Neuron, { NeuronType } from "@/simulation/creature/brain/Neuron";
import { rationalTanh } from "@/simulation/helpers/helpers";

const S = NeuronType.SENSOR;
const N = NeuronType.NEURON;
const A = NeuronType.ACTION;

describe("Network.feedForward", () => {
  test("connections from neurons read the previous output before the latch and the new one after it", () => {
    const neurons = [new Neuron(0.5, true)];
    const network = new Network(1, 1, neurons, [
      new Connection(S, 0, N, 0, 2),     // neuron 0 <- sensor 0
      new Connection(N, 0, N, 0, 1),     // self input: reads the output of the previous step
      new Connection(N, 0, A, 0, 3),     // action 0 <- neuron 0, after the latch
    ]);
    const outputs = network.feedForward([0.25]);
    const neuronOutput = rationalTanh(0.25 * 2 + 0.5 * 1);
    expect(neurons[0].output).toBe(neuronOutput);
    expect(outputs[0]).toBe(rationalTanh(neuronOutput * 3));
  });

  test("without connections to actions the neuron outputs are not updated", () => {
    const neurons = [new Neuron(0.5, true)];
    const network = new Network(1, 1, neurons, [new Connection(S, 0, N, 0, 2)]);
    expect(network.feedForward([1])).toEqual([0]);
    expect(neurons[0].output).toBe(0.5);
  });

  test("connections to neurons after the first connection to an action have no effect", () => {
    const neurons = [new Neuron(0.5, true)];
    const network = new Network(1, 1, neurons, [
      new Connection(S, 0, A, 0, 1),
      new Connection(S, 0, N, 0, 2),
      new Connection(N, 0, A, 0, 1),
    ]);
    const outputs = network.feedForward([0.5]);
    // the neuron was latched with an empty sum
    expect(neurons[0].output).toBe(rationalTanh(0));
    expect(outputs[0]).toBe(rationalTanh(0.5 + rationalTanh(0)));
  });

  test("undriven neurons keep their output", () => {
    const neurons = [new Neuron(0.5, false)];
    const network = new Network(1, 1, neurons, [new Connection(N, 0, A, 0, 2)]);
    expect(network.feedForward([0])[0]).toBe(rationalTanh(1));
    expect(neurons[0].output).toBe(0.5);
  });
});
