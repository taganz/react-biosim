// load the defaults first, like the other tests: other import orders hit a circular import
import "@/simulation/simulationDataDefault";
import WorldController from "@/simulation/world/WorldController";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import { SimulationData } from "@/simulation/SimulationData";
import { startUpScenarioSimulationData } from "@/simulation/startupScenario";

/* main loop control: restart, pause and resume must never leave two loops running */

describe("WorldController main loop", () => {
  let simulationData: SimulationData;
  let worldController: WorldController;
  let steps: number;

  function configure(pauseBetweenSteps: number, stepsPerGen: number, pauseBetweenGenerations: number) {
    simulationData.worldControllerData.pauseBetweenSteps = pauseBetweenSteps;
    simulationData.worldControllerData.immediateSteps = 1;
    simulationData.worldControllerData.stepsPerGen = stepsPerGen;
    simulationData.worldControllerData.pauseBetweenGenerations = pauseBetweenGenerations;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    // WorldController schedules with window.setTimeout
    (globalThis as any).window = globalThis;
    jest.spyOn(console, "log").mockImplementation(() => {});

    simulationData = startUpScenarioSimulationData;
    simulationData.worldGenerationsData.initialPopulation = 10;
    simulationData.worldControllerData.size = 20;

    worldController = new WorldController(simulationData);
    steps = 0;
    worldController.events.addEventListener(WorldEvents.endStep, () => steps++);
  });

  afterEach(() => {
    worldController.pause();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("restart while running does not start a second loop", async () => {
    configure(10, 100000, 0);
    worldController.startRun(simulationData);
    await jest.advanceTimersByTimeAsync(200);
    const stepsFirstRun = steps;

    steps = 0;
    worldController.startRun(simulationData);
    await jest.advanceTimersByTimeAsync(200);

    expect(stepsFirstRun).toBeGreaterThan(0);
    expect(steps).toBeLessThanOrEqual(stepsFirstRun + 1);
  });

  test("pause during the pause between generations is respected", async () => {
    configure(0, 2, 1000);
    worldController.startRun(simulationData);
    await jest.advanceTimersByTimeAsync(10);  // second step done, waiting between generations

    worldController.pause();
    const stepsAtPause = steps;
    await jest.advanceTimersByTimeAsync(3000);

    expect(worldController.isPaused).toBe(true);
    expect(steps).toBe(stepsAtPause);
    // the generation that was ending is completed, not left half done
    expect(worldController.currentGen).toBe(2);
    expect(worldController.currentStep).toBe(1);
  });

  test("pause and resume while a tick is waiting keeps a single loop", async () => {
    // a generation takes 2 steps 10ms apart, then a 50ms pause: 70ms per generation
    configure(10, 2, 50);
    worldController.startRun(simulationData);
    await jest.advanceTimersByTimeAsync(15);  // waiting between generations

    worldController.pause();
    worldController.resume();
    steps = 0;
    await jest.advanceTimersByTimeAsync(700);

    expect(worldController.isPaused).toBe(false);
    expect(steps).toBeGreaterThan(0);
    expect(steps).toBeLessThanOrEqual(21);
  });
});
