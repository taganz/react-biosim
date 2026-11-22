import WorldController from "@/simulation/world/WorldController";
import Creature from "@/simulation/creature/Creature";
import { SimulationData } from "@/simulation/SimulationData";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";

/* lastMovement, which MoveForward repeats, is 0 after a move that fails */

describe("lastMovement", () => {
  let worldController: WorldController;

  beforeEach(() => {
    const simulationData: SimulationData = structuredClone(TEST_SIMULATION_DATA);
    simulationData.worldObjects = [];
    simulationData.worldControllerData.size = 5;
    simulationData.worldGenerationsData.initialPopulation = 0;
    worldController = new WorldController(simulationData);
  });

  // a creature whose brain always pushes east hard enough to try every step
  function eastPusher(x: number, y: number): Creature {
    const creature = worldController.generations.newCreature([x, y], true);
    creature.brain.step = () => creature.addUrgeToMove(100, 0);
    return creature;
  }

  test("is the move made when the creature moves", () => {
    const creature = eastPusher(1, 1);
    creature.computeStep();
    expect(creature.position).toEqual([2, 1]);
    expect(creature.lastMovement).toEqual([1, 0]);
  });

  test("is 0 when the creature is blocked by the border", () => {
    const creature = eastPusher(3, 1);
    creature.computeStep();
    expect(creature.lastMovement).toEqual([1, 0]);
    creature.computeStep();
    expect(creature.position).toEqual([4, 1]);
    expect(creature.lastMovement).toEqual([0, 0]);
  });

  test("is 0 when the creature is blocked by another creature", () => {
    worldController.generations.newCreature([2, 1], true);
    const creature = eastPusher(1, 1);
    creature.lastMovement = [1, 0];
    creature.computeStep();
    expect(creature.position).toEqual([1, 1]);
    expect(creature.lastMovement).toEqual([0, 0]);
  });
});
