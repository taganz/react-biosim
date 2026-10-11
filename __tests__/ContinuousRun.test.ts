// load the defaults first, like the other tests: other import orders hit a circular import
import "@/simulation/simulationDataDefault";
import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { startUpScenarioSimulationData } from "@/simulation/startupScenario";
import RectangleReproductionArea from "@/simulation/world/areas/reproduction/RectangleReproductionArea";
import WorldObject from "@/simulation/world/objects/WorldObject";
import { SavedSimulationData } from "@/simulation/serialization/data/SavedSimulationData";
import {
  serializeWorldGenerationData,
  deserializeWorldGenerationData,
} from "@/simulation/serialization/formatters/worldGenerationDataSerialization";

/* continuous runs: a generation is only a time window and the creatures carry on */

describe("continuous simulation type", () => {
  let simulationData: SimulationData;
  let worldController: WorldController;

  const ids = (wc: WorldController) => wc.generations.currentCreatures.map((c) => c.id).sort();

  function start(simulationType: "generational" | "continuous", stepsPerGen: number, maxAge = 1000,
                 worldObjects: WorldObject[] = []) {
    // copy the parts that change, so the shared startup scenario stays intact
    simulationData = {
      ...startUpScenarioSimulationData,
      worldObjects,
      // the startup scenario has no rain
      waterData: { ...startUpScenarioSimulationData.waterData, waterRainMaxPerCell: 2 },
      worldControllerData: {
        ...startUpScenarioSimulationData.worldControllerData,
        size: 20, stepsPerGen, pauseBetweenSteps: 0, immediateSteps: 1, pauseBetweenGenerations: 0,
      },
      worldGenerationsData: {
        ...startUpScenarioSimulationData.worldGenerationsData,
        initialPopulation: 10, simulationType, maxAge,
      },
    };
    worldController = new WorldController(simulationData);
    worldController.startRun(simulationData);
    worldController.pause();
  }

  beforeEach(() => {
    jest.useFakeTimers();
    // WorldController schedules with window.setTimeout
    (globalThis as any).window = globalThis;
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    worldController.pause();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("the same creatures carry on into the next generation", async () => {
    start("continuous", 3);
    const before = ids(worldController);

    worldController.resume();
    await jest.advanceTimersByTimeAsync(50);
    worldController.pause();

    expect(worldController.currentGen).toBeGreaterThan(1);
    expect(ids(worldController)).toEqual(before);
  });

  test("each generation records population, births and deaths", async () => {
    start("continuous", 3);
    worldController.resume();
    await jest.advanceTimersByTimeAsync(50);
    worldController.pause();

    const first = worldController.generationRegistry.generations[0];
    // metabolism is off in the startup scenario: nobody is born and nobody dies
    expect(first).toMatchObject({ generation: 1, startingPopulation: 10, survivorCount: 10, maxFitnessValue: 10, births: 0, deaths: 0 });
  });

  test("creatures older than maxAge die", () => {
    start("continuous", 1000);
    // startRun has already run a step; every creature has the same age
    const generations = worldController.generations;
    generations.maxAge = generations.currentCreatures[0]._age + 2;
    for (let i = 0; i < 3; i++) generations.step();
    expect(generations.currentCreatures).toHaveLength(10);

    worldController.generations.step();
    expect(worldController.generations.currentCreatures).toHaveLength(0);
    expect(worldController.generations.deathsThisGeneration).toBe(10);
  });

  test("the Age sensor is the age of the creature over maxAge", () => {
    start("continuous", 1000, 10);
    for (let i = 0; i < 4; i++) worldController.generations.step();
    const creature = worldController.generations.currentCreatures[0];
    const ageIndex = worldController.generations.sensors.sensorNameToId("Age");

    const outputs = worldController.generations.sensors.calculateOutputs(creature);
    expect(outputs[ageIndex]).toBeCloseTo(creature._age / 10);
  });

  test("rain can be split in fractions", () => {
    start("continuous", 1000);
    const water = worldController.worldWater;

    let before = water.waterInCells;
    water.rain(worldController.grid, 0.1);
    const tenth = water.waterInCells - before;
    before = water.waterInCells;
    water.rain(worldController.grid);
    const whole = water.waterInCells - before;

    expect(whole).toBeGreaterThan(0);
    expect(tenth).toBeCloseTo(whole * 0.1);
  });

  test("generational runs still replace the creatures", async () => {
    // a reproduction area over the whole world, so every creature survives
    start("generational", 3, 1000, [new RectangleReproductionArea(0, 0, 1, 1)]);
    const before = [...worldController.generations.currentCreatures];
    worldController.resume();
    await jest.advanceTimersByTimeAsync(50);
    worldController.pause();

    expect(worldController.currentGen).toBeGreaterThan(1);
    expect(worldController.generations.currentCreatures.length).toBeGreaterThan(0);
    // the next generation is made of children: none of the creatures of generation 1 is left
    expect(worldController.generations.currentCreatures.some((c) => before.includes(c))).toBe(false);
  });

  describe("loading files", () => {
    function savedWith(changes: object): SavedSimulationData {
      start("generational", 1000);
      const saved = { ...serializeWorldGenerationData(worldController), ...changes };
      return { worldGenerationsData: saved } as SavedSimulationData;
    }

    test("an old Continuous file loads as a continuous run", () => {
      const parsed = savedWith({
        simulationType: undefined, maxAge: undefined,
        populationStrategy: "ContinuousPopulation", selectionMethod: "ContinuousSelection",
      });
      const data = deserializeWorldGenerationData(parsed);
      expect(data.simulationType).toBe("continuous");
      expect(data.maxAge).toBe(1000);
      expect(data.populationStrategy.name).toBe("RandomFixedGenePopulation");
      expect(data.selectionMethod.name).toBe("InsideReproductionAreaSelection");
    });

    test("an old file without simulation type loads as generational", () => {
      const parsed = savedWith({ simulationType: undefined, maxAge: undefined });
      expect(deserializeWorldGenerationData(parsed).simulationType).toBe("generational");
    });

    test("the simulation type and maximum age are saved", () => {
      start("continuous", 1000, 250);
      const saved = serializeWorldGenerationData(worldController);
      expect(saved.simulationType).toBe("continuous");
      expect(saved.maxAge).toBe(250);
    });
  });
});
