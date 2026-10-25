import fs from "fs";
import path from "path";
import WorldController from "@/simulation/world/WorldController";
import migrateSavedSimulationData, { SAVE_FORMAT_VERSION } from "@/simulation/serialization/migrateSavedSimulationData";
import deserializeSimulationData, { serializeSetup, serializeSimulationData } from "@/simulation/serialization/formatters/simulationDataSerialization";
import { loadSavedWorldAndResumeRun } from "@/simulation/world/loadWorld";
import { SavedSimulationData } from "@/simulation/serialization/data/SavedSimulationData";
import { LogLevel } from "@/simulation/logger/LogEvent";
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";

/* files of every version load through migrateSavedSimulationData() */

describe("save format migration", () => {
  let worldController: WorldController;
  let current: SavedSimulationData;

  // the current file as version 1 wrote it: no version, plantGenes as a JSON string
  function version1(changes: { worldControllerData?: object, worldGenerationsData?: object, constants?: object } = {}) {
    const { version, ...file } = current;
    return {
      ...file,
      constants: { ...file.constants, ...changes.constants },
      worldGenerationsData: { ...file.worldGenerationsData, plantGenes: JSON.stringify(file.worldGenerationsData.plantGenes), ...changes.worldGenerationsData },
      worldControllerData: { ...file.worldControllerData, ...changes.worldControllerData },
    };
  }

  beforeEach(() => {
    // WorldController schedules with window.setTimeout
    (globalThis as any).window = globalThis;
    jest.spyOn(console, "log").mockImplementation(() => {});
    worldController = new WorldController(TEST_SIMULATION_DATA);
    worldController.startRun(TEST_SIMULATION_DATA);
    worldController.pause();
    current = serializeSetup(worldController);
  });

  afterEach(() => {
    worldController.pause();
    jest.restoreAllMocks();
  });

  test("saved files have the current version and plantGenes as an array", () => {
    const saved = serializeSimulationData(worldController);
    expect(saved.version).toBe(SAVE_FORMAT_VERSION);
    expect(saved.worldGenerationsData.plantGenes).toEqual(TEST_SIMULATION_DATA.worldGenerationsData.plantGenes);
  });

  test("a file of the current version is not changed", () => {
    expect(migrateSavedSimulationData(current)).toBe(current);
  });

  test("a version 1 file loads like the same file saved now", () => {
    const fromOld = deserializeSimulationData(worldController, version1());
    const fromCurrent = deserializeSimulationData(worldController, current);
    expect(fromOld.worldGenerationsData.plantGenes).toEqual(TEST_SIMULATION_DATA.worldGenerationsData.plantGenes);
    expect(fromOld.worldControllerData).toEqual(fromCurrent.worldControllerData);
    expect(fromOld.constants).toEqual(fromCurrent.constants);
  });

  test("a version 1 file without plantGenes loads with none", () => {
    const old = version1();
    delete (old.worldGenerationsData as { plantGenes?: string }).plantGenes;
    expect(migrateSavedSimulationData(old).worldGenerationsData.plantGenes).toEqual([]);
  });

  test("a file from a newer version of the app is refused", () => {
    expect(() => migrateSavedSimulationData({ ...current, version: SAVE_FORMAT_VERSION + 1 })).toThrow(/newer version/);
  });

  test("JSON that is not a simulation is refused", () => {
    expect(() => migrateSavedSimulationData({ hello: 1 })).toThrow(/not a simulation file/);
    expect(() => migrateSavedSimulationData(null)).toThrow(/not a simulation file/);
  });

  test("drops ATTACK_MULTIPLE_MASS_AT_BIRTH and MASS_COST_PER_EXECUTE_ACTION from version 1 files", () => {
    const data = migrateSavedSimulationData(version1({ worldControllerData: { ATTACK_MULTIPLE_MASS_AT_BIRTH: 3, MASS_COST_PER_EXECUTE_ACTION: 0.01 } })).worldControllerData;
    expect("ATTACK_MULTIPLE_MASS_AT_BIRTH" in data).toBe(false);
    expect("MASS_COST_PER_EXECUTE_ACTION" in data).toBe(false);
    expect(data.ATTACK_MIN_PREY_MASS_FACTOR).toBe(TEST_SIMULATION_DATA.worldControllerData.ATTACK_MIN_PREY_MASS_FACTOR);
  });

  test("version 1 files without ACTION_ATTACK_OFFSET take ACTION_REPRODUCTION_OFFSET", () => {
    const data = migrateSavedSimulationData(version1({ worldControllerData: { ACTION_ATTACK_OFFSET: undefined, ACTION_REPRODUCTION_OFFSET: 0.3 } })).worldControllerData;
    expect(data.ACTION_ATTACK_OFFSET).toBe(0.3);
  });

  test("keeps ACTION_ATTACK_OFFSET when the file has it", () => {
    const data = migrateSavedSimulationData(version1({ worldControllerData: { ACTION_ATTACK_OFFSET: 0.8, ACTION_REPRODUCTION_OFFSET: 0.3 } })).worldControllerData;
    expect(data.ACTION_ATTACK_OFFSET).toBe(0.8);
  });

  test("version 1 files without MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY take MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE", () => {
    const data = migrateSavedSimulationData(version1({ worldControllerData: {
      MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY: undefined, MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE: 0.07,
    } })).worldControllerData;
    expect(data.MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY).toBe(0.07);
  });

  test("converts LOG_LEVEL in version 1 files", () => {
    const constants = migrateSavedSimulationData(version1({ constants: { LOG_LEVEL: LogLevel.STEP } })).constants;
    expect("LOG_LEVEL" in constants).toBe(false);
    expect(constants.LOG_STEP_TOTALS).toBe(true);
  });

  // the scenarios users see first
  const publicDir = path.join(__dirname, "..", "public");
  // see docs/known-issues.md: its creatures carry more mass than the world has water
  const notLoading = ["sim W19 generation 16_herbivores.sim"];
  const samples = fs.readdirSync(publicDir).filter((name) => name.endsWith(".sim") && !notLoading.includes(name));

  test.each(samples)("public/%s loads", (name) => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const target = new WorldController(TEST_SIMULATION_DATA);
    // resumeRun() starts the loop: only the load is tested
    jest.spyOn(target as unknown as { startLoop: () => void }, "startLoop").mockImplementation(() => {});
    const sim = loadSavedWorldAndResumeRun(target, fs.readFileSync(path.join(publicDir, name), "utf8"));
    expect(Array.isArray(sim.worldGenerationsData.plantGenes)).toBe(true);
    target.pause();
  });
});
