import { Network } from "@/simulation/creature/brain/Network";
import Neuron, { NeuronType } from "@/simulation/creature/brain/Neuron";
import Connection from "@/simulation/creature/brain/Connection";
import { computeInfluences, Influence } from "@/simulation/creature/brain/Helpers/networkInfluence";

const { SENSOR, ACTION, NEURON } = NeuronType;

function find(influences: Influence[], sourceType: "sensor" | "constant", sourceId: number, action: number) {
  return influences.find(
    (influence) =>
      influence.source.type === sourceType &&
      (influence.source.type === "sensor" ? influence.source.index : influence.source.neuron) === sourceId &&
      influence.action === action
  );
}

describe("computeInfluences", () => {
  // 2 sensors, 2 actions, N0 driven, N1 undriven (constant)
  const network = new Network(
    2,
    2,
    [new Neuron(0.5, true), new Neuron(0.5, false)],
    [
      new Connection(SENSOR, 0, ACTION, 0, 1),     // S0 -> A0 direct
      new Connection(SENSOR, 0, NEURON, 0, 2),     // S0 -> N0
      new Connection(SENSOR, 1, NEURON, 0, -1),    // S1 -> N0
      new Connection(NEURON, 0, NEURON, 0, 3),     // N0 -> N0 self connection, ignored
      new Connection(NEURON, 0, ACTION, 0, 0.5),   // N0 -> A0
      new Connection(NEURON, 1, ACTION, 1, 3),     // N1 (constant) -> A1
      new Connection(NEURON, 1, NEURON, 1, 2),     // N1 self connection, ignored
    ]
  );
  const influences = computeInfluences(network, 0.5);

  test("adds direct and indirect paths", () => {
    const s0a0 = find(influences, "sensor", 0, 0)!;
    expect(s0a0.total).toBeCloseTo(1 + 2 * 0.5);
    expect(s0a0.paths).toEqual([
      { via: [], value: 1 },
      { via: [0], value: 1 },
    ]);
  });

  test("keeps the sign of negative paths", () => {
    expect(find(influences, "sensor", 1, 0)!.total).toBeCloseTo(-0.5);
  });

  test("undriven neurons are constant sources", () => {
    const constant = find(influences, "constant", 1, 1)!;
    expect(constant.total).toBeCloseTo(0.5 * 3);
    expect(constant.paths).toEqual([{ via: [], value: 1.5 }]);
  });

  test("self connections do not create paths and there are no extra pairs", () => {
    expect(influences).toHaveLength(3);
  });

  test("is sorted by absolute effect", () => {
    expect(influences.map((influence) => Math.abs(influence.total))).toEqual([2, 1.5, 0.5]);
  });

  test("merges parallel connections from duplicated genes", () => {
    const duplicated = new Network(
      1,
      1,
      [new Neuron(0.5, true)],
      [
        new Connection(SENSOR, 0, NEURON, 0, 1),
        new Connection(SENSOR, 0, NEURON, 0, 2),
        new Connection(NEURON, 0, ACTION, 0, 1),
      ]
    );
    const [influence] = computeInfluences(duplicated, 0.5);
    expect(influence.total).toBeCloseTo(3);
    expect(influence.paths).toEqual([{ via: [0], value: 3 }]);
  });

  test("follows chains of neurons", () => {
    const chain = new Network(
      1,
      1,
      [new Neuron(0.5, true), new Neuron(0.5, true)],
      [
        new Connection(SENSOR, 0, NEURON, 0, 2),
        new Connection(NEURON, 0, NEURON, 1, 3),
        new Connection(NEURON, 1, NEURON, 0, 4),   // loop back to N0, not followed twice
        new Connection(NEURON, 1, ACTION, 0, -0.5),
      ]
    );
    const [influence] = computeInfluences(chain, 0.5);
    expect(influence.paths).toEqual([{ via: [0, 1], value: 2 * 3 * -0.5 }]);
  });
});
