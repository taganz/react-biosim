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
  test("turning metabolism on keeps the water of the restored creatures counted", () => {
    const draft = { ...simulationData, worldGenerationsData: { ...simulationData.worldGenerationsData, metabolismEnabled: true } };
    worldControllerSimDataHotChange(worldController, draft);
    worldController.pause();

    const water = worldController.worldWater;
    const totalWater = water.totalWater;
    for (let i = 0; i < 50; i++) worldController.generations.step();
    expect(water.waterInCreatures).toBeGreaterThanOrEqual(0);
    expect(water.totalWater).toBeCloseTo(totalWater, 6);
  });

  test("a code applied with Update simulation is kept by the next restart", () => {
    // with the code it got at random, a restart picks a new one
    expect(worldController.restartSimCode(simulationData)).toBeUndefined();

    const draft = { ...simulationData, worldControllerData: { ...simulationData.worldControllerData, simCode: "my-run" } };
    worldControllerSimDataHotChange(worldController, draft);
    expect(worldController.simCode).toBe("my-run");

    // the draft code now matches the running one, but the user chose it
    worldController.startRun(draft, worldController.restartSimCode(draft));
    worldController.pause();
    expect(worldController.simCode).toBe("my-run");
    // and it stays chosen for the restarts after that
    expect(worldController.restartSimCode(draft)).toBe("my-run");
  });

  test("a restart that repeats the run (fixed seed, no changes) keeps a random code", () => {
    const fixed = { ...simulationData, worldControllerData: { ...simulationData.worldControllerData, seed: 42 } };
    worldController.startRun(fixed);
    worldController.pause();
    const randomCode = worldController.simCode;
    expect(worldController.restartSimCode(fixed)).toBe(randomCode);

    // with changed settings it is another simulation, so it gets a new code
    const changed = { ...fixed, worldControllerData: { ...fixed.worldControllerData, stepsPerGen: 500 } };
    expect(worldController.restartSimCode(changed)).toBeUndefined();
    // and without a fixed seed every restart is a new simulation
    const randomSeed = { ...fixed, worldControllerData: { ...fixed.worldControllerData, seed: undefined } };
    worldController.startRun(randomSeed);
    worldController.pause();
    expect(worldController.restartSimCode(randomSeed)).toBeUndefined();
  });
});
