import WorldController from "@/simulation/world/WorldController";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import { SimulationData } from "@/simulation/SimulationData";
import { startUpScenarioSimulationData } from "@/simulation/startupScenario";
import { SavedSimulationData } from "@/simulation/serialization/data/SavedSimulationData";
import { serializeSimulationData } from "@/simulation/serialization/formatters/simulationDataSerialization";

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

  test("startRun uses the given simulation code, or a new random one", () => {
    configure(10, 100000, 0);
    expect(worldController.startRun(simulationData, "my-run")).toBe("my-run");
    expect(worldController.simCode).toBe("my-run");
    expect(simulationData.worldControllerData.simCode).toBe("my-run");

    const randomCode = worldController.startRun(simulationData);
    expect(randomCode).not.toBe("my-run");
    expect(simulationData.worldControllerData.simCode).toBe(randomCode);
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

  test("saving waits for the pause between generations to end", async () => {
    configure(0, 2, 1000);
    worldController.startRun(simulationData);
    await jest.advanceTimersByTimeAsync(10);  // survivors selected, next generation not made yet
    expect(worldController.isWaiting).toBe(true);

    let saved: SavedSimulationData | undefined;
    worldController.untilBetweenSteps().then(() => {
      saved = serializeSimulationData(worldController);
      worldController.pause();
    });
    await jest.advanceTimersByTimeAsync(500);
    expect(saved).toBeUndefined();

    await jest.advanceTimersByTimeAsync(600);
    expect(worldController.isWaiting).toBe(false);
    expect(saved!.worldControllerData.currentGen).toBe(2);
    expect(saved!.worldControllerData.currentStep).toBe(1);
    expect(saved!.species!.flatMap((s) => s.creatures)).toHaveLength(10);
  });

  test("saving waits for the restart after an extinction", async () => {
    configure(10, 100000, 0);
    worldController.startRun(simulationData);
    worldController.generations.currentCreatures.forEach((creature) => (creature.health = 0));
    await jest.advanceTimersByTimeAsync(10);  // nobody survived the step: waiting to restart
    expect(worldController.isWaiting).toBe(true);
    expect(worldController.generations.currentCreatures).toHaveLength(0);

    let saved: SavedSimulationData | undefined;
    worldController.untilBetweenSteps().then(() => {
      saved = serializeSimulationData(worldController);
    });
    await jest.advanceTimersByTimeAsync(1000);

    expect(saved!.species!.flatMap((s) => s.creatures)).toHaveLength(10);
  });

  test("restarting during a wait does not keep the save waiting", async () => {
    configure(0, 2, 1000);
    worldController.startRun(simulationData);
    await jest.advanceTimersByTimeAsync(10);
    expect(worldController.isWaiting).toBe(true);

    let done = false;
    worldController.untilBetweenSteps().then(() => { done = true; });
    configure(10, 100000, 0);
    worldController.startRun(simulationData);
    // runs the pending promise callbacks only: the old 1000ms pause has not ended
    await jest.advanceTimersByTimeAsync(0);

    expect(done).toBe(true);
    expect(worldController.isWaiting).toBe(false);
  });

  test("without a pause between generations the world is never waiting", async () => {
    configure(0, 2, 0);
    let waited = false;
    worldController.events.addEventListener(WorldEvents.endStep, () => {
      waited ||= worldController.isWaiting;
    });
    worldController.startRun(simulationData);
    await jest.advanceTimersByTimeAsync(50);

    expect(worldController.currentGen).toBeGreaterThan(2);
    expect(waited).toBe(false);
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
