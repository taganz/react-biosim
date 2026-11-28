import { runHeadless } from "@/simulation/headless/runHeadless";
import { computeSpeciesId, speciesOfChild } from "@/simulation/creature/speciesId";
import WorldController from "@/simulation/world/WorldController";
import { SimulationData } from "@/simulation/SimulationData";
import { startUpScenarioSimulationData } from "@/simulation/startupScenario";
import deserializeSimulationData, { serializeSimulationData } from "@/simulation/serialization/formatters/simulationDataSerialization";
import { LogFile, LogState, simFileName } from "@/simulation/log/SimulationLog";
import { creatureKey } from "@/simulation/log/logRows";

/* the log of species and creatures (Simulation → Log) and the lineage species id */

const small = {
  worldControllerData: { size: 20, stepsPerGen: 5 },
  worldGenerationsData: { initialPopulation: 10 },
};

// the rows of a file as objects, by column name
function table(file: LogFile): Record<string, string>[] {
  const [header, ...rows] = file.lines.map((line) => line.replace(/\n$/, "").split(";"));
  return rows.map((cols) => Object.fromEntries(header.map((name, i) => [name, cols[i]])));
}

describe("species id", () => {
  const parent = (speciesId: string, genes: number[]) => ({ speciesId, speciesParentId: null, brain: { genome: { genes } } });

  test("is 16 hexadecimal digits, the same for the same genes and parent", () => {
    const id = computeSpeciesId([1, 2, 3], null);
    expect(id).toMatch(/^[0-9a-f]{16}$/);
    expect(computeSpeciesId([1, 2, 3], null)).toBe(id);
    expect(computeSpeciesId([1, 2, 4], null)).not.toBe(id);
    expect(computeSpeciesId([1, 2, 3], "0000000000000001")).not.toBe(id);
  });

  test("a child with the genes of its parent keeps its species", () => {
    expect(speciesOfChild([1, 2], { ...parent("aaaa", [1, 2]), speciesParentId: "root1" }))
      .toEqual({ speciesId: "aaaa", speciesParentId: "root1" });
  });

  test("the same mutated genome from two parent species is two species", () => {
    const fromA = speciesOfChild([7, 8], parent("aaaa", [1, 2]));
    const fromB = speciesOfChild([7, 8], parent("bbbb", [3, 4]));
    expect(fromA.speciesParentId).toBe("aaaa");
    expect(fromB.speciesParentId).toBe("bbbb");
    expect(fromA.speciesId).not.toBe(fromB.speciesId);
  });

  test("without a parent it is a root", () => {
    expect(speciesOfChild([7, 8], undefined)).toEqual({ speciesId: computeSpeciesId([7, 8], null), speciesParentId: null });
  });
});

describe("log of species and creatures", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("a recording from generation 1 has every species of the tree, with a known parent", async () => {
    const result = await runHeadless({
      base: "startup", generations: 6, seed: 3, log: true,
      overrides: { ...small, constants: { LOG_CREATURES: true } },
    });
    const files = result.worldController.simulationLog.recordedFiles();
    expect(files.map((file) => file.kind)).toEqual(["settings", "species", "creatures"]);
    expect(files[0].name).toMatch(/^sim \w+ log 1-6 settings\.csv$/);
    const species = table(files[1]);
    const ids = new Set(species.map((row) => row.speciesId));
    // a species is written in every generation in which it lived, also the ones that died out
    for (const row of species) {
      if (row.speciesParentId !== "") expect(ids.has(row.speciesParentId)).toBe(true);
    }
    expect(species.some((row) => row.speciesParentId !== "")).toBe(true);
    // one species, one parent: the same in every row
    const parents = new Map<string, string>();
    for (const row of species) {
      if (parents.has(row.speciesId)) expect(parents.get(row.speciesId)).toBe(row.speciesParentId);
      parents.set(row.speciesId, row.speciesParentId);
    }
    // the creatures alive at the end of each generation are the alive of its species
    const creatures = table(files[2]);
    for (const generation of [1, 2, 3, 4, 5, 6]) {
      const alive = species.filter((row) => Number(row.generation) === generation)
        .reduce((total, row) => total + Number(row.alive), 0);
      const living = creatures.filter((row) => Number(row.generation) === generation && row.alive === "1").length;
      expect(living).toBe(alive);
    }
    // every creature row has a species of the file of species
    expect(creatures.every((row) => ids.has(row.speciesId))).toBe(true);
  });

  test("the log does not change the run", async () => {
    const run = (log: boolean) => runHeadless({ base: "startup", generations: 4, seed: 9, log, overrides: small });
    const strip = (rows: { durationMs: number }[]) => rows.map(({ durationMs, ...row }) => row);
    const [withLog, withoutLog] = [await run(true), await run(false)];
    expect(strip(withLog.rows)).toEqual(strip(withoutLog.rows));
  });
});

describe("snapshot", () => {
  let simulationData: SimulationData;
  let worldController: WorldController;

  beforeEach(() => {
    jest.useFakeTimers();
    (globalThis as any).window = globalThis;
    jest.spyOn(console, "log").mockImplementation(() => {});
    simulationData = {
      ...startUpScenarioSimulationData,
      worldObjects: [],
      worldControllerData: { ...startUpScenarioSimulationData.worldControllerData, size: 10, stepsPerGen: 1000, seed: 5 },
      worldGenerationsData: { ...startUpScenarioSimulationData.worldGenerationsData, initialPopulation: 12 },
      constants: { ...startUpScenarioSimulationData.constants, LOG_CREATURES: true, LOG_LOCALE_STRING: "en-US" },
    };
    worldController = new WorldController(simulationData);
    worldController.startRun(simulationData);
    worldController.pause();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("has a row per living creature and per species", () => {
    const [settings, species, creatures] = worldController.simulationLog.snapshot();
    const living = worldController.generations.currentCreatures.filter((creature) => creature.isAlive);
    expect(settings.name).toBe(`sim ${worldController.simCode} log 1 step ${worldController.currentStep} settings.csv`);
    // the .sim saved with the files takes the name of the settings file
    expect(simFileName([species, settings, creatures])).toBe(`sim ${worldController.simCode} log 1 step ${worldController.currentStep}.sim`);
    expect(simFileName([species])).toBeNull();
    expect(table(creatures).length).toBe(living.length);
    expect(new Set(table(species).map((row) => row.speciesId))).toEqual(new Set(living.map((creature) => creature.speciesId)));
    expect(table(species).reduce((total, row) => total + Number(row.alive), 0)).toBe(living.length);
    // the settings file starts with the log, then the settings and constants
    expect(table(settings).find((row) => row.name === "formatVersion")?.value).toBe("1");
    expect(table(settings).some((row) => row.kind === "SETTING" && row.name === "initialPopulation")).toBe(true);
    // en-US: a point as decimal separator, and no thousands separator
    expect(table(creatures).every((row) => !row.mass.includes(","))).toBe(true);
  });

  test("with Marked in Population only the marked ones are written", () => {
    const log = worldController.simulationLog;
    const [first, second] = worldController.generations.currentCreatures;
    log.setScope("marked");
    log.setCreatureMarked(first, true);
    log.setSpeciesMarked(second.speciesId, true);
    const [, species, creatures] = log.snapshot();
    expect(table(species).map((row) => row.speciesId)).toEqual([second.speciesId]);
    const keys = table(creatures).map((row) => row.creatureKey);
    expect(keys).toContain(creatureKey(first.birthGen, first.id));
    const ofSecond = worldController.generations.currentCreatures.filter((creature) => creature.speciesId === second.speciesId);
    for (const creature of ofSecond) expect(keys).toContain(creatureKey(creature.birthGen, creature.id));
  });

  test("a saved file keeps the species and when they appeared", () => {
    const saved = JSON.parse(JSON.stringify(serializeSimulationData(worldController, true)));
    const target = new WorldController(simulationData);
    jest.spyOn(target as unknown as { startLoop: () => void }, "startLoop").mockImplementation(() => {});
    target.resumeRun(deserializeSimulationData(target, saved));
    const ids = (wc: WorldController) => wc.generations.currentCreatures.map((creature) => creature.speciesId).sort();
    expect(ids(target)).toEqual(ids(worldController));
    const id = worldController.generations.currentCreatures[0].speciesId;
    expect(target.generations.speciesRegistry.firstGenOf(id)).toBe(1);
  });

  test("a recording stopped by a restart keeps the recorded simulation and its code", () => {
    const log = worldController.simulationLog;
    const ids = (wc: WorldController) => wc.generations.currentCreatures.map((creature) => creature.speciesId).sort();
    const recordedCode = worldController.simCode;
    const recordedIds = ids(worldController);
    log.startRecording();
    worldController.startRun({ ...simulationData, worldControllerData: { ...simulationData.worldControllerData, seed: 6 } }, "NEWRUN");
    worldController.pause();
    expect(log.state).toBe(LogState.RUN_REPLACED);
    // the files keep the code of the recorded run
    expect(simFileName(log.recordedFiles())).toBe(`sim ${recordedCode} log 1.sim`);
    // the .sim is the recorded world as it was before the restart, not the new run
    const saved = JSON.parse(JSON.stringify(log.recordedSim()));
    expect(saved.worldControllerData.simCode).toBe(recordedCode);
    const target = new WorldController(simulationData);
    jest.spyOn(target as unknown as { startLoop: () => void }, "startLoop").mockImplementation(() => {});
    target.resumeRun(deserializeSimulationData(target, saved));
    expect(ids(target)).toEqual(recordedIds);
    expect(ids(target)).not.toEqual(ids(worldController));
    // going on with the recording: the .sim is the running simulation again
    log.resumeRecording();
    expect(log.recordedSim()?.worldControllerData.simCode).toBe("NEWRUN");
    expect(simFileName(log.recordedFiles())).toBe(`sim ${recordedCode} log 1.sim`);
  });

  test("a recording stopped by a loaded file keeps the recorded simulation", () => {
    const log = worldController.simulationLog;
    const saved = JSON.parse(JSON.stringify(serializeSimulationData(worldController, false)));
    saved.worldControllerData.simCode = "LOADED";
    log.startRecording();
    const recordedCode = worldController.simCode;
    jest.spyOn(worldController as unknown as { startLoop: () => void }, "startLoop").mockImplementation(() => {});
    worldController.resumeRun(deserializeSimulationData(worldController, saved));
    expect(log.state).toBe(LogState.RUN_REPLACED);
    expect(log.recordedSim()?.worldControllerData.simCode).toBe(recordedCode);
  });
});
