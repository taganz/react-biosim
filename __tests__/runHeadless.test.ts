import { runHeadless, applyOverrides } from "@/simulation/headless/runHeadless";

/* headless runner: runs the real loop with real timers, on a small world */

const small = {
  worldControllerData: { size: 20, stepsPerGen: 5 },
  worldGenerationsData: { initialPopulation: 10 },
};

describe("runHeadless", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("applyOverrides merges objects and replaces other values", () => {
    const unknown: string[] = [];
    const result = applyOverrides(
      { a: { b: 1, c: 2 }, list: [1, 2] },
      { a: { c: 3, typo: 4 }, list: [5] },
      unknown,
    );
    expect(result).toEqual({ a: { b: 1, c: 3, typo: 4 }, list: [5] });
    expect(unknown).toEqual(["a.typo"]);
  });

  test("completes the requested generations with one row each", async () => {
    const rows: number[] = [];
    const result = await runHeadless({
      base: "startup", generations: 3, overrides: small, onGeneration: (row) => rows.push(row.generation),
    });
    expect(result.status).toBe("completed");
    expect(rows).toEqual([1, 2, 3]);
    expect(result.worldController.currentGen).toBe(4);
    expect(result.worldController.isPaused).toBe(true);
    expect(result.rows[0]).toMatchObject({ run: 0, generation: 1, startingPopulation: 10 });
  });

  test("applies the overrides and reports unknown keys", async () => {
    const result = await runHeadless({
      base: "startup", generations: 1,
      overrides: { ...small, worldGenerationsData: { initialPopulation: 7, notASetting: 1 } },
    });
    expect(result.worldController.size).toBe(20);
    expect(result.setup.worldGenerationsData.initialPopulation).toBe(7);
    expect(result.rows[0].startingPopulation).toBe(7);
    expect(result.unknownKeys).toEqual(["worldGenerationsData.notASetting"]);
  });

  test("stops at maxSeconds", async () => {
    const result = await runHeadless({ base: "startup", generations: 1e9, overrides: small, maxSeconds: 0.2 });
    expect(result.status).toBe("timeout");
    expect(result.worldController.isPaused).toBe(true);
  });

  test("the log has the survivors of each generation in its generation", async () => {
    const result = await runHeadless({ base: "startup", generations: 3, overrides: small, log: true, seed: 1 });
    // LogLevel;StepIndex;CurrentGen;CurrentStep;...;EventType;ParamName;ParamValue;...
    const survivors = result.worldController.eventLogger.getLog().split("\n")
      .map((line) => line.split(";"))
      .filter((cols) => cols[7] === "GENERATION_END" && cols[8] === "survivors")
      .map((cols) => [Number(cols[2]), Number(cols[3]), Number(cols[9]), cols[10]]);
    // ParamValue2: % of Initial population (10), written with the es-ES locale
    expect(survivors).toEqual(result.rows.map((row) =>
      [row.generation, 5, row.survivorCount, (row.survivorCount * 10).toLocaleString("es-ES")]));
  });
});
