import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { startUpScenarioSimulationData } from "@/simulation/startupScenario";
import RectangleReproductionArea from "@/simulation/world/areas/reproduction/RectangleReproductionArea";
import WorldObject from "@/simulation/world/objects/WorldObject";
import { serializeWorldGenerationData } from "@/simulation/serialization/formatters/worldGenerationDataSerialization";
import deserializeSimulationData, { serializeSetup } from "@/simulation/serialization/formatters/simulationDataSerialization";
import generationRegistryFormatter from "@/simulation/serialization/formatters/generationRegistryFormatter";
import { populationSampleInterval } from "@/simulation/world/stats/GenerationRegistry";

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

  test("in generational runs creatures older than maxAge die before the generation ends", () => {
    start("generational", 1000);
    const generations = worldController.generations;
    generations.maxAge = generations.currentCreatures[0]._age + 2;
    for (let i = 0; i < 3; i++) generations.step();
    expect(generations.currentCreatures.every((c) => c.isAlive)).toBe(true);

    generations.step();
    expect(generations.currentCreatures.some((c) => c.isAlive)).toBe(false);
  });

  test("in generational runs a maxAge longer than the generation does nothing", () => {
    start("generational", 5, 1000);
    expect(worldController.generations.currentCreatures[0].maxAge).toBe(6);
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
    // a file without a version (version 1) with these changes, as it loads
    function loadOldFileWith(changes: object) {
      start("generational", 1000);
      const { version, ...file } = serializeSetup(worldController);
      const old = { ...file, worldGenerationsData: { ...file.worldGenerationsData, ...changes } };
      return deserializeSimulationData(worldController, old).worldGenerationsData;
    }

    test("an old Continuous file loads as a continuous run", () => {
      const data = loadOldFileWith({
        simulationType: undefined, maxAge: undefined,
        populationStrategy: "ContinuousPopulation", selectionMethod: "ContinuousSelection",
      });
      expect(data.simulationType).toBe("continuous");
      expect(data.maxAge).toBe(1000);
      expect(data.populationStrategy.name).toBe("RandomFixedGenePopulation");
      expect(data.selectionMethod.name).toBe("InsideReproductionAreaSelection");
    });

    test("an old file without simulation type loads as generational", () => {
      expect(loadOldFileWith({ simulationType: undefined, maxAge: undefined }).simulationType).toBe("generational");
    });

    test("the simulation type and maximum age are saved", () => {
      start("continuous", 1000, 250);
      const saved = serializeWorldGenerationData(worldController);
      expect(saved.simulationType).toBe("continuous");
      expect(saved.maxAge).toBe(250);
    });
  });

  describe("population samples", () => {
    async function runSteps(ms: number) {
      worldController.resume();
      await jest.advanceTimersByTimeAsync(ms);
      worldController.pause();
    }

    test("the interval is a tenth of the shorter of maxAge and stepsPerGen", () => {
      expect(populationSampleInterval(50, 300)).toBe(5);
      expect(populationSampleInterval(1000, 300)).toBe(30);
      expect(populationSampleInterval(5, 300)).toBe(1);
    });

    test("continuous runs with metabolism count plants and animals every interval", async () => {
      start("continuous", 20, 1000);
      // only the check of the registry; the creatures keep their metabolism off
      worldController.generations.metabolismEnabled = true;
      await runSteps(100);

      const samples = worldController.generationRegistry.populationSamples;
      expect(worldController.currentGen).toBeGreaterThan(1);
      expect(samples.length).toBeGreaterThan(2);
      // interval min(1000, 20) / 10 = 2, counted across generations
      samples.forEach((sample, i) => {
        expect(sample.step % 2).toBe(0);
        if (i > 0) expect(sample.step - samples[i - 1].step).toBe(2);
        expect(sample.plants + sample.animals).toBe(10);
        // all the water is in the cloud, the cells or the creatures
        expect(sample.cloud! + sample.cells! + sample.plantWater! + sample.animalWater!).toBeCloseTo(worldController.worldWater.totalWater, 3);
      });
      expect(samples.some((sample) => sample.step > 20)).toBe(true);
    });

    test("generational runs with metabolism are sampled too", async () => {
      start("generational", 20, 1000);
      worldController.generations.metabolismEnabled = true;
      await runSteps(30);
      expect(worldController.generationRegistry.populationSamples.length).toBeGreaterThan(2);
    });

    test("generational runs with metabolism record a rain between generations", async () => {
      start("generational", 20, 1000);
      worldController.generations.metabolismEnabled = true;
      await runSteps(70);
      const rains = worldController.generationRegistry.rainEvents;
      expect(worldController.currentGen).toBeGreaterThan(1);
      // at the first step of every generation after the first
      const expected = Array.from({ length: worldController.currentGen - 1 }, (_, i) => (i + 1) * 20 + 1);
      expect(rains.map((rain) => rain.step)).toEqual(expected);
      rains.forEach((rain) => expect(rain.skipped).toBeUndefined());
      const loaded = generationRegistryFormatter.deserialize(generationRegistryFormatter.serialize(worldController.generationRegistry), worldController);
      expect(loaded.rainEvents.map((rain) => rain.step)).toEqual(expected);
    });

    test("a rain the cloud cannot pay for is recorded as skipped", () => {
      start("generational", 20, 1000);
      worldController.generations.metabolismEnabled = true;
      const registry = worldController.generationRegistry;
      registry.recordRain(null);
      expect(registry.rainEvents.at(-1)).toMatchObject({ water: 0, skipped: true });
      const loaded = generationRegistryFormatter.deserialize(generationRegistryFormatter.serialize(registry), worldController);
      expect(loaded.rainEvents.at(-1)).toMatchObject({ water: 0, skipped: true });
      // rains at the same step add up, and a real rain clears the skip
      registry.recordRain(5);
      expect(registry.rainEvents.at(-1)).toEqual({ step: registry.rainEvents.at(-1)!.step, water: 5 });
      worldController.worldWater.waterInCloud = 0;
      expect(worldController.worldWater.rain(worldController.grid)).toBeNull();
    });

    test("continuous runs count the rain of every step in the samples", async () => {
      start("continuous", 20, 1000);
      worldController.generations.metabolismEnabled = true;
      await runSteps(30);
      const samples = worldController.generationRegistry.populationSamples;
      expect(samples.length).toBeGreaterThan(1);
      // it rains every step, and the cloud has water for it
      samples.forEach((sample) => expect(sample.noRainSteps).toBe(0));
      expect(samples.some((sample) => sample.rain! > 0)).toBe(true);
      // a rain bigger than the cloud does not fall
      const water = worldController.worldWater;
      water.waterData = { ...water.waterData, waterRainMaxPerCell: 1e9 };
      const before = samples.length;
      await runSteps(30);
      const dry = samples.slice(before);
      expect(dry.length).toBeGreaterThan(0);
      dry.forEach((sample) => {
        expect(sample.rain).toBe(0);
        expect(sample.noRainSteps).toBe(2);
      });
    });

    test("without metabolism there are no samples", async () => {
      start("continuous", 20, 40);
      await runSteps(100);
      expect(worldController.generationRegistry.populationSamples).toEqual([]);
    });

    test("the samples are saved and loaded with the stats", async () => {
      start("continuous", 20, 1000);
      worldController.generations.metabolismEnabled = true;
      await runSteps(50);
      const registry = worldController.generationRegistry;
      const loaded = generationRegistryFormatter.deserialize(generationRegistryFormatter.serialize(registry), worldController);
      // the water is saved with 2 decimals
      const round = (value: number | undefined) => (value === undefined ? undefined : Math.round(value * 100) / 100);
      expect(loaded.populationSamples).toEqual(registry.populationSamples.map((sample) => ({
        ...sample, cloud: round(sample.cloud), cells: round(sample.cells), plantWater: round(sample.plantWater), animalWater: round(sample.animalWater), rain: round(sample.rain),
      })));
      expect(registry.populationSamples.length).toBeGreaterThan(0);
    });
  });
});
