/*
 * Headless runner: npm run sim -- [config.json] [options]
 * See docs/user/headless-runner.md.
 */
import fs from "node:fs";
import path from "node:path";
import {
  runHeadless, applyOverrides, GenerationRow, HeadlessOptions, SimulationOverrides,
} from "@/simulation/headless/runHeadless";
import { serializeSimulationData } from "@/simulation/serialization/formatters/simulationDataSerialization";
import { SavedSimulationData } from "@/simulation/serialization/data/SavedSimulationData";

type RunConfig = {
  name?: string;
  /** "startup", "default" or the path of a .sim file */
  base?: string;
  resume?: boolean;
  generations?: number;
  overrides?: SimulationOverrides;
  seed?: number;
  log?: boolean;
  maxRestarts?: number;
  maxSeconds?: number;
  /** print a progress line every this many generations (0: never) */
  progressEvery?: number;
  out?: string;
};

const USAGE = `Usage: npm run sim -- [config.json] [options]

Options (they override the config file):
  --base <startup|default|file.sim>   settings to start from (default: startup)
  --resume                            continue the saved run in the base file
  --generations <n>                   generations to complete (default: 100)
  --name <name>                       name of the run (default: config file name or "run")
  --out <dir>                         output folder (default: results/<name>)
  --set <path>=<value>                change one setting, e.g. --set worldGenerationsData.initialPopulation=500
                                      (value is read as JSON, otherwise as text; can be repeated)
  --seed <n>                          seed of the random generator: the same seed repeats the run
                                      (default: the base's seed, or a random one; printed in summary.json)
  --log                               write the event log (log.csv)
  --max-restarts <n>                  stop when the population dies out more than n times (default: 5)
  --max-seconds <s>                   stop after s seconds
  --progress <n>                      print a line every n generations (default: 10, 0: never)
  --help`;

function fail(message: string): never {
  console.error(`sim: ${message}\n\n${USAGE}`);
  process.exit(1);
}

function parseValue(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function parseNumber(option: string, text: string | undefined): number {
  const value = Number(text);
  if (text === undefined || Number.isNaN(value)) fail(`${option} needs a number`);
  return value;
}

function parseArgs(argv: string[]): RunConfig {
  let config: RunConfig = {};
  const sets: SimulationOverrides = {};
  const cli: RunConfig = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case "--help": console.log(USAGE); process.exit(0);
      case "--base": cli.base = next(); break;
      case "--resume": cli.resume = true; break;
      case "--generations": cli.generations = parseNumber(arg, next()); break;
      case "--name": cli.name = next(); break;
      case "--out": cli.out = next(); break;
      case "--log": cli.log = true; break;
      case "--seed": cli.seed = parseNumber(arg, next()); break;
      case "--max-restarts": cli.maxRestarts = parseNumber(arg, next()); break;
      case "--max-seconds": cli.maxSeconds = parseNumber(arg, next()); break;
      case "--progress": cli.progressEvery = parseNumber(arg, next()); break;
      case "--set": {
        const assignment = next() ?? "";
        const equals = assignment.indexOf("=");
        if (equals < 1) fail(`--set needs <path>=<value>, got "${assignment}"`);
        const keys = assignment.slice(0, equals).split(".");
        // build { a: { b: value } } from a.b=value
        const nested = keys.reduceRight<unknown>((value, key) => ({ [key]: value }), parseValue(assignment.slice(equals + 1)));
        Object.assign(sets, applyOverrides(sets, nested as SimulationOverrides));
        break;
      }
      default:
        if (arg.startsWith("--")) fail(`unknown option ${arg}`);
        if (!fs.existsSync(arg)) fail(`config file not found: ${arg}`);
        config = JSON.parse(fs.readFileSync(arg, "utf8"));
        config.name ??= path.basename(arg, path.extname(arg));
        // a base file is relative to the config file
        if (config.base && !["startup", "default"].includes(config.base)) {
          config.base = path.resolve(path.dirname(arg), config.base);
        }
    }
  }
  return {
    ...config,
    ...cli,
    overrides: applyOverrides(config.overrides ?? {}, sets),
  };
}

const CSV_COLUMNS: (keyof GenerationRow)[] = [
  "run", "generation", "startingPopulation", "survivorCount", "births", "deaths", "maxFitnessValue",
  "durationMs", "nextPopulation", "nextPlants", "nextAttackPlants", "nextAttackAnimals", "nextUnknown",
];

function toCsv(rows: GenerationRow[]): string {
  // ";" like the event log
  return [CSV_COLUMNS.join(";"), ...rows.map((row) => CSV_COLUMNS.map((column) => row[column]).join(";"))].join("\n") + "\n";
}

function average(rows: GenerationRow[], column: keyof GenerationRow): number {
  return rows.length === 0 ? 0 : Math.round(rows.reduce((total, row) => total + row[column], 0) / rows.length * 100) / 100;
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  const name = config.name ?? "run";
  const generations = config.generations ?? 100;
  const progressEvery = config.progressEvery ?? 10;
  const baseName = config.base ?? "startup";
  const outDir = path.resolve(config.out ?? path.join("results", name));

  let base: HeadlessOptions["base"];
  if (baseName === "startup" || baseName === "default") {
    base = baseName;
  } else {
    if (!fs.existsSync(baseName)) fail(`base file not found: ${baseName}`);
    base = JSON.parse(fs.readFileSync(baseName, "utf8")) as SavedSimulationData;
  }

  // the engine prints a line on every extinction; keep the output for the runner's own lines
  const engineLog = console.log;
  console.log = () => {};
  const print = (line: string) => engineLog(line);

  print(`sim: ${name}, base ${baseName}${config.resume ? " (resume)" : ""}, ${generations} generations`);
  const result = await runHeadless({
    base,
    resume: config.resume,
    generations,
    overrides: config.overrides,
    seed: config.seed,
    log: config.log,
    maxRestarts: config.maxRestarts,
    maxSeconds: config.maxSeconds,
    onGeneration: (row) => {
      if (progressEvery > 0 && row.generation % progressEvery === 0) {
        print(`  run ${row.run} gen ${row.generation}: population ${row.startingPopulation}, survivors ${row.survivorCount},`
          + ` births ${row.births}, deaths ${row.deaths}, next ${row.nextPopulation}`
          + ` (plants ${row.nextPlants}, attack_plant ${row.nextAttackPlants}, attack_animal ${row.nextAttackAnimals}, unknown ${row.nextUnknown})`);
      }
    },
  });
  console.log = engineLog;

  const wc = result.worldController;
  const lastRows = result.rows.filter((row) => row.run === result.restarts).slice(-10);
  const summary = {
    name,
    status: result.status,
    base: baseName,
    resume: config.resume ?? false,
    generationsRequested: generations,
    generationsRun: result.rows.length,
    finalGeneration: wc.currentGen,
    restarts: result.restarts,
    seconds: Math.round(result.seconds * 10) / 10,
    simCode: wc.simCode,
    seed: wc.seed,
    overrides: config.overrides,
    unknownOverrideKeys: result.unknownKeys,
    lastGeneration: result.rows[result.rows.length - 1] ?? null,
    last10Average: {
      startingPopulation: average(lastRows, "startingPopulation"),
      survivorCount: average(lastRows, "survivorCount"),
      births: average(lastRows, "births"),
      deaths: average(lastRows, "deaths"),
      maxFitnessValue: average(lastRows, "maxFitnessValue"),
      durationMs: average(lastRows, "durationMs"),
    },
    files: ["summary.json", "generations.csv", "setup.sim", "final.sim", ...(config.log ? ["log.csv"] : [])],
  };

  fs.mkdirSync(outDir, { recursive: true });
  const write = (file: string, data: string) => fs.writeFileSync(path.join(outDir, file), data);
  write("summary.json", JSON.stringify(summary, null, 2));
  write("generations.csv", toCsv(result.rows));
  write("setup.sim", JSON.stringify(result.setup, null, 2));
  write("final.sim", JSON.stringify(serializeSimulationData(wc, true)));
  if (config.log) write("log.csv", wc.eventLogger.getLog());

  for (const key of result.unknownKeys) print(`warning: "${key}" is not a setting of the base; it was added but probably does nothing`);
  print(JSON.stringify({ ...summary, overrides: undefined }, null, 2));
  print(`sim: seed ${wc.seed}, results in ${outDir}`);
  // the extinction restart can leave a timer behind
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
