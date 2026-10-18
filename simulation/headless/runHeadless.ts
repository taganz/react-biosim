import { CONSTANTS_DEFAULT, DEFAULT_GENUS_PROBABILITIES } from "@/simulation/constantsDefault";
import { startUpScenarioSimulationData } from "@/simulation/startupScenario";
import WorldController from "@/simulation/world/WorldController";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import { SimulationData } from "@/simulation/SimulationData";
import { SavedSimulationData } from "@/simulation/serialization/data/SavedSimulationData";
import deserializeSimulationData, { serializeSetup } from "@/simulation/serialization/formatters/simulationDataSerialization";

/*
 * Runs a simulation without the browser, as fast as the CPU allows.
 * Used by scripts/sim.ts (npm run sim); it does no file access itself.
 */

/** Partial SavedSimulationData: each value replaces the one of the base, objects are merged key by key */
export type SimulationOverrides = { [key: string]: unknown };

export type HeadlessOptions = {
  /** "startup" (the settings the app opens with) or the contents of a .sim file */
  base: "startup" | SavedSimulationData;
  /** continue a saved run (its creatures or start genomes) instead of starting from generation 1 */
  resume?: boolean;
  /** generations to complete */
  generations: number;
  overrides?: SimulationOverrides;
  /** seed of the random generator; on resume it replaces the saved random state. Missing: the base's seed, or a random one */
  seed?: number;
  /** record the event log from the first generation */
  log?: boolean;
  /** stop when the population dies out more than this many times (default 5) */
  maxRestarts?: number;
  /** stop after this many seconds (default: no limit) */
  maxSeconds?: number;
  onGeneration?: (row: GenerationRow) => void;
};

export type GenerationRow = {
  /** 0, then 1 more each time the population died out and the run restarted from generation 1 */
  run: number;
  generation: number;
  startingPopulation: number;
  survivorCount: number;
  births: number;
  deaths: number;
  maxFitnessValue: number;
  durationMs: number;
  /** population at the start of the next generation, and by genus */
  nextPopulation: number;
  nextPlants: number;
  nextAttackPlants: number;
  nextAttackAnimals: number;
  /** genus "unknown": brains without the genus-defining actions */
  nextUnknown: number;
};

export type HeadlessStatus = "completed" | "extinct" | "timeout";

export type HeadlessResult = {
  status: HeadlessStatus;
  worldController: WorldController;
  /** the settings and map the run started with, loadable in the app */
  setup: SavedSimulationData;
  rows: GenerationRow[];
  restarts: number;
  seconds: number;
  /** override keys that do not exist in the base: probably typos */
  unknownKeys: string[];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Copy of target with overrides applied: plain objects are merged, everything else is replaced */
export function applyOverrides<T>(target: T, overrides: SimulationOverrides, unknownKeys: string[] = [], path = ""): T {
  const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  for (const [key, value] of Object.entries(overrides)) {
    const keyPath = path ? `${path}.${key}` : key;
    if (!(key in result)) unknownKeys.push(keyPath);
    result[key] = isPlainObject(value) && isPlainObject(result[key])
      ? applyOverrides(result[key], value, unknownKeys, keyPath)
      : value;
  }
  return result as T;
}

export function runHeadless(options: HeadlessOptions): Promise<HeadlessResult> {
  // WorldController schedules its loop with window.setTimeout
  if (typeof window === "undefined") (globalThis as Record<string, unknown>).window = globalThis;

  const worldController = new WorldController(startUpScenarioSimulationData);
  // the base as a saved file, so a .sim file and the built-in bases go through the same path as loading in the app
  // older files lack newer constants (e.g. POPULATION_DEFAULT_GENUS): take those from the defaults,
  // with the default genus list so that Random Fixed Genera can create a population
  const saved: SavedSimulationData = typeof options.base === "object"
    ? { ...options.base, constants: { ...CONSTANTS_DEFAULT, POPULATION_DEFAULT_GENUS: DEFAULT_GENUS_PROBABILITIES, ...(options.base.constants as unknown as object) } as unknown as string }
    : serializeSetup(worldController);

  const unknownKeys: string[] = [];
  const merged = applyOverrides(saved, options.overrides ?? {}, unknownKeys);
  // no pauses and few redraw events: nothing is drawn
  merged.worldControllerData = { ...merged.worldControllerData, pauseBetweenSteps: 0, pauseBetweenGenerations: 0, immediateSteps: 1000 };
  if (options.seed !== undefined) {
    const { rngState, ...worldControllerData } = merged.worldControllerData;
    merged.worldControllerData = { ...worldControllerData, seed: options.seed };
  }
  // --log turns the logger on, which is off by default
  if (options.log) {
    merged.constants = { ...(merged.constants as unknown as object), LOG_ENABLED: true } as unknown as string;
  }
  const sim = deserializeSimulationData(worldController, merged);

  const maxRestarts = options.maxRestarts ?? 5;
  const rows: GenerationRow[] = [];
  let run = 0;
  let generationsDone = 0;
  let setup: SavedSimulationData | undefined;
  let stopReason: HeadlessStatus | undefined;
  const startTime = performance.now();

  return new Promise((resolve) => {
    const finish = (status: HeadlessStatus) => {
      worldController.pause();
      clearTimeout(timeoutId);
      resolve({
        status, worldController, setup: setup!, rows, restarts: run,
        seconds: (performance.now() - startTime) / 1000, unknownKeys,
      });
    };

    const timeoutId = options.maxSeconds
      ? setTimeout(() => finish("timeout"), options.maxSeconds * 1000)
      : undefined;

    const events = worldController.events;
    events.addEventListener(WorldEvents.initializeWorld, () => {
      // the first one is the start below, before any step; later ones are restarts after the population died out
      if (!setup) {
        // with the seed this run used, so loading the setup repeats the run
        setup = serializeSetup(worldController);
        setup.worldControllerData.seed = worldController.seed;
        // the logger was reset by the start: record from this generation on (a resumed run is not at generation 1)
        if (options.log) worldController.eventLogger.resume();
        return;
      }
      run++;
      generationsDone = 0;
      if (run > maxRestarts) stopReason = "extinct";
    });
    // startRun() starts the loop after initializeWorld, so a stop is applied at the next step
    events.addEventListener(WorldEvents.startStep, () => {
      if (stopReason) finish(stopReason);
    });
    events.addEventListener(WorldEvents.endGeneration, () => {
      const registry = worldController.generationRegistry.generations;
      const last = registry[registry.length - 1];
      const creatures = worldController.generations.currentCreatures;
      const countGenus = (genus: string) => creatures.filter((creature) => creature.genus === genus).length;
      const row: GenerationRow = {
        run,
        generation: last.generation,
        startingPopulation: last.startingPopulation,
        survivorCount: last.survivorCount,
        births: last.births ?? 0,
        deaths: last.deaths ?? 0,
        maxFitnessValue: last.maxFitnessValue,
        durationMs: worldController.lastGenerationDuration,
        nextPopulation: creatures.length,
        nextPlants: countGenus("plant"),
        nextAttackPlants: countGenus("attack_plant"),
        nextAttackAnimals: countGenus("attack_animal"),
        nextUnknown: countGenus("unknown"),
      };
      rows.push(row);
      options.onGeneration?.(row);
      generationsDone++;
      if (generationsDone >= options.generations) finish("completed");
    });

    const hasCreatures = sim.startGenomes !== undefined || sim.species !== undefined;
    if (options.resume && hasCreatures) {
      if (sim.startGenomes) {
        worldController.startGeneration(sim);
      } else {
        worldController.resumeRun(sim);
      }
    } else {
      worldController.startRun(sim);
    }
  });
}
