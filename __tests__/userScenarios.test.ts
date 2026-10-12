// load the defaults first, like the other tests: other import orders hit a circular import
import "@/simulation/simulationDataDefault";
import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { startUpScenarioSimulationData } from "@/simulation/startupScenario";
import {
  serializeGenerationStart,
  serializeSetup,
  serializeSimulationData,
} from "@/simulation/serialization/formatters/simulationDataSerialization";
import { loadSavedSimulationAndStartRun, loadSavedWorldAndResumeRun } from "@/simulation/world/loadWorld";
import SelectionMethod from "@/simulation/generations/selection/SelectionMethod";
import WorldGenerations from "@/simulation/generations/WorldGenerations";
import worldControllerSimDataHotChange from "@/simulation/world/worldControllerSimDataHotChange";

// every creature survives, so each generation is full
const everybodySurvives: SelectionMethod = {
  name: "InsideReproductionAreaSelection",
  prettyName: "everybody survives",
  isContinuous: false,
  fitnessValueName: "",
  shouldResetLastCreatureIdCreatedEveryGeneration: true,
  getSurvivors: (generations: WorldGenerations) => ({ survivors: [...generations.currentCreatures], fitnessMaxValue: 0 }),
};

/* "My scenarios" in the Files tab: save the setup, or the genomes at the start of a generation */

describe("user scenarios", () => {
  let simulationData: SimulationData;
  let worldController: WorldController;

  const genomes = (list: { genes: number[] }[]) => list.map((g) => g.genes.join(",")).sort();
  const creatureGenomes = (wc: WorldController) =>
    genomes(wc.generations.currentCreatures.map((c) => c.brain.genome));

  // ends the current generation like the loop does: selection, repopulation and stats
  const endGeneration = (wc: WorldController) => (wc as any).endGeneration((wc as any)._runId);

  const newController = () => {
    const wc = new WorldController(simulationData);
    wc.startRun(simulationData);
    wc.pause();
    return wc;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    // WorldController schedules with window.setTimeout
    (globalThis as any).window = globalThis;
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});

    // copy the parts that change, so the shared startup scenario stays intact
    simulationData = {
      ...startUpScenarioSimulationData,
      worldObjects: [],
      worldControllerData: {
        ...startUpScenarioSimulationData.worldControllerData,
        size: 20,
        stepsPerGen: 1000,
        pauseBetweenGenerations: 0,
      },
      worldGenerationsData: {
        ...startUpScenarioSimulationData.worldGenerationsData,
        initialPopulation: 10,
        selectionMethod: everybodySurvives,
      },
    };
    worldController = newController();
  });

  afterEach(() => {
    worldController.pause();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("the generation start keeps the genomes the generation started with", async () => {
    await endGeneration(worldController);
    await endGeneration(worldController);
    const startGenomes = creatureGenomes(worldController);
    expect(startGenomes).toHaveLength(10);
    // creatures that die during the generation are still saved
    worldController.generations.currentCreatures.splice(0, 3);

    const saved = serializeGenerationStart(worldController, false);

    expect(saved.worldControllerData.currentGen).toBe(3);
    expect(saved.worldControllerData.currentStep).toBe(1);
    expect(saved.species).toBeUndefined();
    expect(saved.stats).toBeUndefined();
    expect(saved.startGenomes!.reduce((total, g) => total + g.count, 0)).toBe(10);
    expect(genomes(saved.startGenomes!.flatMap((g) => Array(g.count).fill(g)))).toEqual(startGenomes);
  });

  test("loading a generation start starts that generation with the saved genomes, unmutated", async () => {
    await endGeneration(worldController);
    await endGeneration(worldController);
    const startGenomes = creatureGenomes(worldController);
    expect(startGenomes).toHaveLength(10);
    const json = JSON.stringify(serializeGenerationStart(worldController, true));

    const other = newController();
    const loaded = loadSavedWorldAndResumeRun(other, json);
    other.pause();

    expect(loaded.worldControllerData.currentGen).toBe(3);
    expect(other.currentGen).toBe(3);
    // the loop runs one step before the pause
    expect(other.currentStep).toBeLessThanOrEqual(2);
    expect(other.simCode).toBe(worldController.simCode);
    expect(creatureGenomes(other)).toEqual(startGenomes);
    expect(other.generationRegistry.generations.map((g) => g.generation)).toEqual([1, 2]);
  });

  test("without the stats history the run starts with an empty history", async () => {
    await endGeneration(worldController);
    const other = newController();
    loadSavedWorldAndResumeRun(other, JSON.stringify(serializeGenerationStart(worldController, false)));
    other.pause();

    expect(other.currentGen).toBe(2);
    expect(other.generationRegistry.generations).toEqual([]);
  });

  test("a setup starts a new run from generation 1 with the same settings", async () => {
    await endGeneration(worldController);
    const saved = serializeSetup(worldController);
    expect(saved.worldControllerData.currentGen).toBe(1);
    expect(saved.species).toBeUndefined();
    expect(saved.startGenomes).toBeUndefined();

    const other = newController();
    loadSavedSimulationAndStartRun(other, JSON.stringify(saved));
    other.pause();

    expect(other.currentGen).toBe(1);
    expect(other.generations.currentCreatures).toHaveLength(10);
    expect(other.size).toBe(20);
  });

  test("Save to file writes the current generation and step, not the ones from load time", async () => {
    await endGeneration(worldController);
    worldController.currentStep = 7;
    const saved = serializeSimulationData(worldController);
    expect(saved.worldControllerData.currentGen).toBe(2);
    expect(saved.worldControllerData.currentStep).toBe(7);
    expect(saved.worldControllerData.simCode).toBe(worldController.simCode);
    // the running configuration is not changed by saving
    expect(worldController.simData.worldControllerData.currentGen).not.toBe(2);
  });

  test("Save to file writes where the creatures are now", () => {
    worldController.generations.step();
    const saved = serializeSimulationData(worldController);
    const savedPositions = saved.species!.flatMap((s) => s.creatures.map((c) => c.position.join(","))).sort();
    const positions = worldController.generations.currentCreatures.map((c) => c.position.join(",")).sort();
    expect(savedPositions).toEqual(positions);
  });

  test("Save to file can leave out the stats history", async () => {
    await endGeneration(worldController);
    expect(serializeSimulationData(worldController).stats!.generations).toHaveLength(1);
    expect(serializeSimulationData(worldController, false).stats).toBeUndefined();
  });

  test("loading a file without stats starts an empty history, not the previous run's", async () => {
    await endGeneration(worldController);
    const json = JSON.stringify(serializeSimulationData(worldController, false));
    await endGeneration(worldController);
    expect(worldController.generationRegistry.generations).toHaveLength(2);

    loadSavedWorldAndResumeRun(worldController, json);
    worldController.pause();

    expect(worldController.currentGen).toBe(2);
    expect(worldController.generationRegistry.generations).toEqual([]);
  });

  test("Update simulation after loading a file keeps the history recorded since the load", async () => {
    const draft = loadSavedWorldAndResumeRun(worldController, JSON.stringify(serializeSimulationData(worldController)));
    worldController.pause();
    await endGeneration(worldController);
    await endGeneration(worldController);

    worldControllerSimDataHotChange(worldController, draft);
    worldController.pause();

    expect(worldController.generationRegistry.generations.map((g) => g.generation)).toEqual([1, 2]);
  });
});
