# Headless runner

`npm run sim` runs a simulation in Node, without the browser and without drawing. It runs as fast as the CPU allows, writes its results to a folder, and is the way to run experiments from a script or from Claude.

```bash
npm run sim -- --generations 200 --name first-try
```

Everything after `--` goes to the runner. The code is in [scripts/sim.ts](../../scripts/sim.ts) (command line and files) and [simulation/headless/runHeadless.ts](../../simulation/headless/runHeadless.ts) (the run).

## What it does

1. Takes a **base**: the scenario the app opens with (`startup`, the default), the built-in defaults (`default`), or a `.sim` file saved from the app.
2. Applies the **overrides**: settings you change, written as a part of the `.sim` file.
3. Starts a new run from generation 1, or with `--resume` continues the run saved in the base file.
4. Runs until the requested number of generations has finished, then writes the results.

It uses the same code as the app: the base goes through the same deserializer as **Load**, and the loop is `WorldController`'s. Only two things differ:

- the speed settings are forced: no pauses, and a redraw event every 1000 steps;
- constants missing from an older `.sim` file, such as `POPULATION_DEFAULT_GENUS`, are taken from the defaults. Without them *Random Fixed Gene* cannot create a population.

## Options

| Option | Default | Meaning |
|---|---|---|
| `config.json` (first argument) | none | A config file, see below. The options below override it. |
| `--base <startup\|default\|file.sim>` | `startup` | Settings to start from |
| `--resume` | off | Continue the run saved in the base file: its creatures, or the genomes of a file saved at the start of a generation. Without it, a `.sim` file is used as a setup and the run starts at generation 1. |
| `--generations <n>` | 100 | Generations to complete |
| `--name <name>` | config file name, or `run` | Name of the run |
| `--out <dir>` | `results/<name>` | Output folder. Files in it are overwritten. `results/` is ignored by git. |
| `--set <path>=<value>` | none | Change one setting. Can be repeated. The value is read as JSON (`500`, `true`, `"text"`, `[1,2]`), otherwise as text. |
| `--seed <n>` | the base's `seed`, or a random one | Seed of the random generator. The same seed, base and overrides repeat the run exactly. With `--resume` it replaces the random state saved in the file. |
| `--log` | off | Turn the logger on, record the [event log](../reference/log-file.md) and write `log.csv` |
| `--max-restarts <n>` | 5 | Stop when the population has died out more than `n` times |
| `--max-seconds <s>` | no limit | Stop after `s` seconds |
| `--progress <n>` | 10 | Print a line every `n` generations; 0 prints none |
| `--help` | | Print the options |

## Settings paths

Overrides use the paths of the `.sim` file, which [Parameters](../reference/parameters.md) lists for every setting. The main groups are `worldControllerData` (size, steps per generation, metabolism costs), `worldGenerationsData` (population, selection, mutation, sensors and actions), `waterData` and `constants`.

```bash
npm run sim -- --set worldControllerData.size=64 --set worldGenerationsData.initialPopulation=300 \
  --set worldGenerationsData.mutationProbability=0.01 --generations 500 --name small-world
```

- Objects are merged key by key; any other value, lists included, replaces the old one. To change the enabled sensors, give the whole list.
- Population strategies and selection methods are given by class name, as in the `.sim` file: `--set worldGenerationsData.selectionMethod='"ReproductionSelection"'`. See [Population and selection](../reference/population-and-selection.md).
- A path that does not exist in the base is added anyway, and the runner prints a warning: it is probably a typo. `summary.json` lists them in `unknownOverrideKeys`.

## Config file

The same options in a JSON file, handy for experiments you repeat. Keep them in `experiments/`; [experiments/example.json](../../experiments/example.json) is one. Paths in `base` are relative to the config file.

```json
{
  "name": "example-plants-low-mutation",
  "base": "../public/plants_2024_05_19.sim",
  "generations": 20,
  "overrides": {
    "worldGenerationsData": { "mutationProbability": 0.005 }
  },
  "log": false,
  "maxRestarts": 3,
  "maxSeconds": 600,
  "progressEvery": 5
}
```

```bash
npm run sim -- experiments/example.json --generations 50
```

## Output

| File | Content |
|---|---|
| `summary.json` | Status, generations run, restarts, time, simulation code, seed, the overrides, the last generation and the average of the last 10 generations. The runner also prints it at the end. |
| `generations.csv` | One row per finished generation, separated by `;` like the log |
| `setup.sim` | The settings and map the run started with, and its seed: running it again (`--base results/<name>/setup.sim`) repeats the run. Load it in the app to watch the same configuration; delete `seed` from it to get a different run on every Restart. |
| `final.sim` | The whole simulation at the end, with creatures and stats. Load it in the app, or continue it with `--base results/<name>/final.sim --resume`. |
| `log.csv` | The event log, with `--log` only |

**Status** is `completed`, `extinct` (the population died out more than `--max-restarts` times) or `timeout` (`--max-seconds`).

**`generations.csv` columns:**

| Column | Meaning |
|---|---|
| `run` | 0, then one more after every extinction: the engine restarts from generation 1 with the same settings |
| `generation` | Generation number |
| `startingPopulation`, `survivorCount`, `births`, `deaths`, `maxFitnessValue` | The generation's stats, as in the Stats tab |
| `durationMs` | Time the generation took |
| `nextPopulation` | Population at the start of the next generation |
| `nextPlants`, `nextAttackPlants`, `nextAttackAnimals`, `nextUnknown` | The same population by [genus](../model/creatures.md) |

With `--log`, recording starts at the first generation that starts at step 1: generation 1 for a new run, and with `--resume` of a file saved mid-generation, the next one. Logging every step makes the run much slower and the file large; the logger stops at `LOG_EVENTLOGGER_MAX_EVENTS` events.

## Running simulations from Claude

Claude Code can run the runner, read `summary.json` and `generations.csv`, and compare runs. Ask in plain words, for example:

- "Run 300 generations of the startup scenario with mutation probability 0.01 and 0.05, and compare the survivors."
- "Continue `public/turn right generation 5574.sim` for 100 generations and tell me if survival improves."
- "Find the smallest initial population at which the herbivores do not die out."

- "Repeat the last run with seeds 1 to 5 and give me the average survivors."

Claude then picks the options, runs one `npm run sim` per experiment with a different `--name`, and reads the files in `results/`. For long runs, ask for `--max-seconds` so a run cannot go on for hours.

## Limits

- A run is repeatable with the same seed, but one run is still one sample: to compare settings, run several seeds and compare averages.
- Resuming `final.sim` is deterministic (the same file always continues the same way), but it does not give exactly the generations an uninterrupted run would have: restored creatures act in a different order. See [Save format](../development/serialization.md).
- Nothing is drawn, so there are no images or GIFs. Load `final.sim` in the app to see the world.
- `.sim` files older than the `plantGenes` setting do not load, in the runner or in the app. See [Known issues](../known-issues.md).
