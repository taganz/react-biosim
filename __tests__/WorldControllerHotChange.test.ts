// load the defaults first, like the other tests: other import orders hit a circular import
import "@/simulation/simulationDataDefault";
import WorldController from "@/simulation/world/WorldController";
import worldControllerSimDataHotChange from "@/simulation/world/worldControllerSimDataHotChange";
import { SimulationData } from "@/simulation/SimulationData";
import { startUpScenarioSimulationData } from "@/simulation/startupScenario";
import RectangleObject from "@/simulation/world/objects/RectangleObject";

/* "Update simulation" (hot change) must keep the creatures that are alive, bound to the new world */

describe("WorldController hot change", () => {
  let simulationData: SimulationData;
  let worldController: WorldController;

  const positions = (wc: WorldController) =>
    wc.generations.currentCreatures.map((c) => `${c.position[0]},${c.position[1]}`).sort();

  beforeEach(() => {
    jest.useFakeTimers();
    // WorldController schedules with window.setTimeout
    (globalThis as any).window = globalThis;
    jest.spyOn(console, "log").mockImplementation(() => {});

    // copy the parts that change, so the shared startup scenario stays intact
    simulationData = {
      ...startUpScenarioSimulationData,
      worldObjects: [],
      worldControllerData: { ...startUpScenarioSimulationData.worldControllerData, size: 20, stepsPerGen: 1000 },
      worldGenerationsData: { ...startUpScenarioSimulationData.worldGenerationsData, initialPopulation: 10 },
    };
    worldController = new WorldController(simulationData);
    worldController.startRun(simulationData);
    worldController.pause();
  });

  afterEach(() => {
    worldController.pause();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("keeps the living creatures, their genomes and the generation", () => {
    worldController.generations.step();
    const count = worldController.generations.currentCreatures.length;
    const genomes = worldController.generations.currentCreatures.map((c) => c.brain.genome.toDecimalString(false)).sort();
    const generation = worldController.currentGen;

    const draft = { ...simulationData, worldGenerationsData: { ...simulationData.worldGenerationsData, mutationProbability: 0.1 } };
    worldControllerSimDataHotChange(worldController, draft);
    worldController.pause();

    // resumeRun runs one step before the pause, so positions may change by one cell
    expect(worldController.generations.currentCreatures).toHaveLength(count);
    expect(worldController.generations.currentCreatures.map((c) => c.brain.genome.toDecimalString(false)).sort()).toEqual(genomes);
    expect(worldController.currentGen).toBe(generation);
    expect(worldController.generations.mutationProbability).toBe(0.1);
  });

  test("restored creatures use the new generations and grid", () => {
    const draft = { ...simulationData };
    worldControllerSimDataHotChange(worldController, draft);
    worldController.pause();

    for (const creature of worldController.generations.currentCreatures) {
      expect(creature.generations).toBe(worldController.generations);
      expect(worldController.grid.cell(creature.position[0], creature.position[1]).creature).toBe(creature);
    }
  });

  test("drops creatures outside a smaller world or under a new obstacle", () => {
    const creatures = worldController.generations.currentCreatures;
    creatures[0].position = [15, 15];   // outside a 10x10 world
    creatures[1].position = [2, 2];     // under the new obstacle
    for (let i = 2; i < creatures.length; i++) creatures[i].position = [5, i - 2];

    const draft = {
      ...simulationData,
      worldControllerData: { ...simulationData.worldControllerData, size: 10 },
      worldObjects: [new RectangleObject(0.2, 0.2, 0.1, 0.1)],
    };
    worldControllerSimDataHotChange(worldController, draft);
    worldController.pause();

    expect(worldController.generations.currentCreatures).toHaveLength(creatures.length - 2);
    expect(positions(worldController)).not.toContain("15,15");
    expect(positions(worldController)).not.toContain("2,2");
  });
});
