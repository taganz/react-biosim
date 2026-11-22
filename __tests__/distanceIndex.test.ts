import Creature from "@/simulation/creature/Creature";

/* the distance index (fitness of Greatest Distance), driven by hand without a world */

type Probe = {
  position: [number, number]; lastPosition: [number, number];
  distanceCovered: number; distancePartial: number; stepsStopped: number;
  lastDirection: string | null; stepDirection: string | null;
  computeDistanceIndex(): void;
};

function newProbe(): Probe {
  const creature = Object.create(Creature.prototype) as Probe;
  Object.assign(creature, {
    position: [0, 0], lastPosition: [0, 0], distanceCovered: 0, distancePartial: 0,
    stepsStopped: 0, lastDirection: null, stepDirection: null,
  });
  return creature;
}

// one step as computeStep does it: moves east, or stays put
function step(creature: Probe, moves: boolean) {
  creature.lastPosition = [creature.position[0], creature.position[1]];
  if (moves) {
    creature.position = [creature.position[0] + 1, creature.position[1]];
    creature.stepDirection = "E";
  }
  creature.computeDistanceIndex();
  creature.lastDirection = creature.stepDirection;
}

describe("distance index", () => {
  test("a straight run scores every step after the first 35 of the run", () => {
    const creature = newProbe();
    // the first step has no previous direction, so the run starts at the second
    for (let i = 0; i < 100; i++) step(creature, true);
    expect(creature.distanceCovered).toEqual(100 - 1 - 35);
  });

  test("a run longer than 120 steps keeps scoring", () => {
    const creature = newProbe();
    for (let i = 0; i < 300; i++) step(creature, true);
    expect(creature.distancePartial).toEqual(120);
    expect(creature.distanceCovered).toEqual(300 - 1 - 35);
  });

  test("standing still more than 100 steps takes points away, down to 0", () => {
    const creature = newProbe();
    for (let i = 0; i < 100; i++) step(creature, true);
    for (let i = 0; i < 110; i++) step(creature, false);
    expect(creature.distanceCovered).toEqual(64 - 10);
    for (let i = 0; i < 100; i++) step(creature, false);
    expect(creature.distanceCovered).toEqual(0);
  });
});
