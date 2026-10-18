import WorldController from "@/simulation/world/WorldController";
import WorldWater from "@/simulation/water/WorldWater";
import { SimulationData } from "@/simulation/SimulationData";
import { startUpScenarioSimulationData } from "@/simulation/startupScenario";
import { SavedSimulationData } from "@/simulation/serialization/data/SavedSimulationData";
import deserializeSimulationData, {
  serializeSimulationData, serializeSetup, serializeGenerationStart,
} from "@/simulation/serialization/formatters/simulationDataSerialization";
import worldControllerSimDataHotChange from "@/simulation/world/worldControllerSimDataHotChange";

/* a resumed run continues where the saved one was: creature ages and cell water are kept */

describe("resume from a saved file", () => {
  let simulationData: SimulationData;
  let worldController: WorldController;

  const ages = (wc: WorldController) => wc.generations.currentCreatures.map((c) => `${c.position}:${c._age}`).sort();

  // resumeRun() starts the loop, which runs a step before a pause: skip it to compare the exact state
  const withoutLoop = (wc: WorldController) =>
    jest.spyOn(wc as unknown as { startLoop: () => void }, "startLoop").mockImplementation(() => {});

  // what Load does: a JSON round trip, then the same deserializer
  const reload = (saved: SavedSimulationData) => {
    const target = new WorldController(simulationData);
    withoutLoop(target);
    const sim = deserializeSimulationData(target, JSON.parse(JSON.stringify(saved)));
    target.resumeRun(sim);
    return target;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    // WorldController schedules with window.setTimeout
    (globalThis as any).window = globalThis;
    jest.spyOn(console, "log").mockImplementation(() => {});

    // copy the parts that change, so the shared startup scenario stays intact
    simulationData = {
      ...startUpScenarioSimulationData,
      worldObjects: [],
      worldControllerData: { ...startUpScenarioSimulationData.worldControllerData, size: 10, stepsPerGen: 1000 },
      worldGenerationsData: {
        ...startUpScenarioSimulationData.worldGenerationsData,
        initialPopulation: 10, simulationType: "continuous", maxAge: 1000,
      },
    };
    worldController = new WorldController(simulationData);
    worldController.startRun(simulationData);
    worldController.pause();
    for (let i = 0; i < 5; i++) worldController.generations.step();

    // uneven cell water, as after creatures have been drinking; the change is taken from the cloud
    const cell = worldController.grid.cell(3, 4);
    const delta = 12.345 - cell.water;
    cell.water += delta;
    worldController.worldWater.waterInCells += delta;
    worldController.worldWater.waterInCloud -= delta;
  });

  afterEach(() => {
    worldController.pause();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("creatures keep their age", () => {
    expect(worldController.generations.currentCreatures[0]._age).toBeGreaterThan(0);
    const resumed = reload(serializeSimulationData(worldController));
    expect(ages(resumed)).toEqual(ages(worldController));
  });

  test("cells keep their water and the total water does not change", () => {
    const resumed = reload(serializeSimulationData(worldController));
    expect(WorldWater.cellWater(resumed.grid)).toEqual(
      WorldWater.cellWater(worldController.grid).map((water) => Math.round(water * 1000) / 1000));
    expect(resumed.grid.cell(3, 4).water).toBe(12.345);
    expect(resumed.worldWater.waterInCells).toBeCloseTo(worldController.worldWater.waterInCells, 6);
    expect(resumed.worldWater.waterInCreatures).toBeCloseTo(worldController.worldWater.waterInCreatures, 6);
    expect(resumed.worldWater.totalWater).toBeCloseTo(worldController.worldWater.totalWater, 6);
  });

  test("a file without cell water gets the first rain", () => {
    const { cellWater, ...older } = serializeSimulationData(worldController);
    expect(cellWater).toBeDefined();
    const resumed = reload(older);
    expect(resumed.grid.cell(3, 4).water).toBe(simulationData.waterData.waterFirstRainPerCell);
    expect(resumed.worldWater.totalWater).toBeCloseTo(worldController.worldWater.totalWater, 6);
  });

  test("setups and generation starts do not save cell water", () => {
    expect(serializeSetup(worldController).cellWater).toBeUndefined();
    expect(serializeGenerationStart(worldController, false).cellWater).toBeUndefined();
  });

  test("a hot change keeps the cell water", () => {
    withoutLoop(worldController);
    const before = WorldWater.cellWater(worldController.grid);
    const total = worldController.worldWater.totalWater;
    worldControllerSimDataHotChange(worldController, { ...simulationData });
    expect(WorldWater.cellWater(worldController.grid)).toEqual(before);
    expect(worldController.worldWater.totalWater).toBeCloseTo(total, 6);
  });
});
