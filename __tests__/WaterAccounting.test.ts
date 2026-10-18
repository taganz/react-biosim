import { TEST_SIMULATION_DATA } from "./support/testSimulationData";
import WorldController from "@/simulation/world/WorldController";

/* with metabolism, all mass is water: the water counted in creatures must match their mass */

describe("water accounting with metabolism", () => {
  let worldController: WorldController;

  beforeEach(() => {
    jest.useFakeTimers();
    // WorldController schedules with window.setTimeout
    (globalThis as any).window = globalThis;
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    worldController.pause();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function start(simulationType: "generational" | "continuous", stepsPerGen: number) {
    const sim = {
      ...TEST_SIMULATION_DATA,
      worldObjects: [],
      worldControllerData: {
        ...TEST_SIMULATION_DATA.worldControllerData,
        size: 30, stepsPerGen, pauseBetweenSteps: 0, immediateSteps: 1, pauseBetweenGenerations: 0,
        // low enough that plants reproduce
        REPRODUCTION_MULTIPLE_MASS_AT_BIRTH: 3,
      },
      worldGenerationsData: {
        ...TEST_SIMULATION_DATA.worldGenerationsData,
        initialPopulation: 150, simulationType, metabolismEnabled: true,
      },
    };
    worldController = new WorldController(sim);
    worldController.startRun(sim);
    worldController.pause();
  }

  const creaturesMass = () =>
    worldController.generations.currentCreatures.reduce((total, creature) => total + creature.mass, 0);

  async function runSteps(count: number) {
    const runId = (worldController as any)._runId;
    for (let i = 0; i < count; i++) {
      const result = await (worldController as any).runStep(runId);
      if (result === "restarted") throw new Error("everybody died");
    }
  }

  test("reproduction hands the parent's mass to the child", async () => {
    start("continuous", 1000);
    await runSteps(60);

    expect(worldController.generations.birthsThisGeneration).toBeGreaterThan(0);
    expect(worldController.worldWater.waterInCreatures).toBeCloseTo(creaturesMass(), 6);
  });

  test("a new generation takes its mass from the cloud", async () => {
    start("generational", 20);
    await runSteps(45);

    expect(worldController.currentGen).toBe(3);
    expect(worldController.worldWater.waterInCreatures).toBeCloseTo(creaturesMass(), 6);
  });

  test("a failed attempt never takes more mass than the creature has", () => {
    start("continuous", 1000);
    const creature = worldController.generations.currentCreatures[0];
    creature._mass._mass = 0.05;
    const before = worldController.worldWater.waterInCreatures;

    creature._mass.consumeMassFraction(0.1);

    expect(creature.mass).toBe(0);
    expect(before - worldController.worldWater.waterInCreatures).toBeCloseTo(0.05);
  });
});
