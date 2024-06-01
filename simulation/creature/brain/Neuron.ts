export enum NeuronType {
  SENSOR = 1,
  ACTION = 1,
  NEURON = 0,
}

export default class Neuron {
  constructor(public output: number, public driven: boolean) {}
}

export const neuronTypeToString = (neuron: NeuronType): string => {
  switch (neuron) {
    case NeuronType.SENSOR:
      return 'Sensor';
    case NeuronType.ACTION:
      return 'Action';
    case NeuronType.NEURON:
      return 'Neuron';
    default:
      throw new Error('Unknown NeuronType');
  }
};