import { NeuronType } from "./Neuron";

//TODO do we need a Connection class?

export type ConnectionType = {
  sourceType: NeuronType, // SENSOR or NEURON
  sourceId: number,
  sinkType: NeuronType, // NEURON or ACTION
  sinkId: number,
  weight: number
}; 

export default class Connection {
  constructor(
    public sourceType: NeuronType, // SENSOR or NEURON
    public sourceId: number,
    public sinkType: NeuronType, // NEURON or ACTION
    public sinkId: number,
    public weight: number
  ) {}

  copy() {
    return new Connection(
      this.sourceType,
      this.sourceId,
      this.sinkType,
      this.sinkId,
      this.weight
    );
  }
}
