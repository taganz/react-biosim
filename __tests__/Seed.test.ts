import { random, randomInt, shuffle, setSeed, getRandomState, setRandomState } from "@/simulation/helpers/random";
import { runHeadless, GenerationRow } from "@/simulation/headless/runHeadless";
import { serializeSimulationData } from "@/simulation/serialization/formatters/simulationDataSerialization";
import { SavedSimulationData } from "@/simulation/serialization/data/SavedSimulationData";

/* the seeded random generator, and runs that repeat with the same seed */

// durationMs is the only column that depends on the clock
const results = (rows: GenerationRow[]) => rows.map(({ durationMs, ...row }) => row);

// a small world with metabolism, so births and deaths depend on the random numbers
const small = {
  worldControllerData: { size: 20, stepsPerGen: 10 },
  worldGenerationsData: { initialPopulation: 30 },
};

describe("random generator", () => {
  test("the same seed gives the same numbers", () => {
    setSeed(42);
    const first = [random(), random(), randomInt(100)];
    setSeed(42);
    expect([random(), random(), randomInt(100)]).toEqual(first);
    setSeed(43);
    expect([random(), random(), randomInt(100)]).not.toEqual(first);
  });

  test("numbers are in [0, 1)", () => {
    setSeed(1);
    for (let i = 0; i < 10000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  test("a saved state goes on with the same numbers", () => {
    setSeed(7);
    random();
    const state = getRandomState();
    const next = [random(), random()];
    setRandomState(state);
    expect([random(), random()]).toEqual(next);
  });

  test("shuffle returns a permutation and leaves the input alone", () => {
    setSeed(5);
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const result = shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...result].sort()).toEqual(input);
  });
});

describe("runs with a seed", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("the same seed repeats the run, another seed does not", async () => {
    const run = (seed: number) => runHeadless({ base: "startup", generations: 3, overrides: small, seed });
    const first = await run(42);
    const second = await run(42);
    const other = await run(43);
    expect(first.worldController.seed).toBe(42);
    expect(results(second.rows)).toEqual(results(first.rows));
    expect(results(other.rows)).not.toEqual(results(first.rows));
  });

  test("the setup of a run repeats it, without giving the seed again", async () => {
    const first = await runHeadless({ base: "startup", generations: 3, overrides: small, seed: 42 });
    expect(first.setup.worldControllerData.seed).toBe(42);
    expect(first.setup.worldControllerData.rngState).toBeUndefined();
    const again = await runHeadless({ base: JSON.parse(JSON.stringify(first.setup)), generations: 3 });
    expect(results(again.rows)).toEqual(results(first.rows));
  });

  test("a run without a seed gets a random one", async () => {
    const first = await runHeadless({ base: "startup", generations: 1, overrides: small });
    const second = await runHeadless({ base: "startup", generations: 1, overrides: small });
    expect(first.worldController.seed).not.toBe(second.worldController.seed);
  });

  test("resuming the same saved file gives the same result", async () => {
    const first = await runHeadless({ base: "startup", generations: 2, overrides: small, seed: 42 });
    const saved: SavedSimulationData = JSON.parse(JSON.stringify(serializeSimulationData(first.worldController, true)));
    expect(saved.worldControllerData.runSeed).toBe(42);
    expect(saved.worldControllerData.rngState).toBeDefined();

    const resume = () => runHeadless({ base: JSON.parse(JSON.stringify(saved)), resume: true, generations: 2 });
    const a = await resume();
    const b = await resume();
    expect(a.rows[0].generation).toBe(3);
    expect(a.worldController.seed).toBe(42);
    expect(results(b.rows)).toEqual(results(a.rows));
  });

  test("a file with a sensor that no longer exists runs like its own setup", async () => {
    const first = await runHeadless({ base: "startup", generations: 1, overrides: small, seed: 42 });
    const withOldSensor: SavedSimulationData = JSON.parse(JSON.stringify(first.setup));
    withOldSensor.worldGenerationsData.enabledSensors = [
      "Touch" as never, ...withOldSensor.worldGenerationsData.enabledSensors,
    ];
    const old = await runHeadless({ base: withOldSensor, generations: 2 });
    const clean = await runHeadless({ base: JSON.parse(JSON.stringify(first.setup)), generations: 2 });
    expect(old.worldController.generations.enabledSensors).not.toContain("Touch");
    expect(results(old.rows)).toEqual(results(clean.rows));
  });
});
