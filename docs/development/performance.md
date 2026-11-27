# Performance

Where the engine spends its time, what has already been done to speed it up, and the options that are left, ranked. Measured in November 2026 on the headless runner (Node 24, Windows, 20 hardware threads). The browser was not profiled: drawing the canvas comes on top of everything here.

## Summary

- **Without prey sensors or MoveToPrey** the step is already lean: about 110 ms per generation for 1000 creatures in the startup scenario. The time is spread over the creature step, the network and the sensors, and no single function is worth a rewrite.
- **With prey sensors or MoveToPrey**, the prey search (`detectClosest`) takes about **60 %** of the time. It is the one hot spot, and the best place to start.
- For experiments that run many seeds, **running them in parallel** gives far more than any engine change, and touches no engine code.

## Where the time goes

### With hunters: the foraging pilot

`experiments/forage-pilot.json` with MoveToPrey enabled: 100×100, 2000 creatures (about 400 animals), 300 steps per generation, 15 generations. Self time, measured on 21 November 2026:

| Function | Share |
|---|---|
| `detectClosest` (prey search) | **59 %** |
| `writeOutputs` (sensors) | 4 % |
| `computeStep` | 3 % |
| `feedForward` (network) | 3 % |
| `WorldGenerations.step` | 3 % |
| Everything else | under 3 % each |

With inlining off the search splits into `matching` (30 %), the search loop itself (20 %) and `grid.cell()` (16 %). So the cost is **reading cells**, not the arithmetic. Each cell is an object inside an array of arrays, and the check goes cell → creature → genus. With `DETECT_RADIUS` 10, one search reads up to 440 cells.

Counting the searches gives:

- About **1 search per animal per step** (2 million in 20 generations). Every animal that reads a prey sensor, or is connected to MoveToPrey, searches once per thought.
- **2–3 µs per search**. Searches get slower when hunters eat well: with MoveToPrey the closest plant is further away, and a search took about 50 % longer (3.1 µs against 2.0 µs).
- **Unchanged without MoveToPrey.** Enabling MoveToPrey did not change the time spent outside the search.

### Without hunters: the startup scenario

`npm run sim --generations 15 --seed 1`: 1000 creatures, no prey sensors read. Measured on 27 November 2026, 1.8 s in total:

| Function | Share |
|---|---|
| `Creature.computeStep` | 20 % |
| `feedForward` | 17 % |
| `writeOutputs` | 12 % |
| `Creature.move` | 7 % |
| `WorldGenerations.step` | 7 % |
| `executeActions` | 5 % |

The rest is startup (reading and compiling files) and small items. `feedForward` already runs on connections compiled into flat arrays (see [Network.ts](../../simulation/creature/brain/Network.ts)), and sensors are computed only when a brain reads them.

## Already done

- **One ring-by-ring prey search.** The prey sensors share one search per creature, which goes ring by ring and stops at the first ring with a match. Before, they listed every creature in the radius, twice. With 8000 creatures a step went from about 145 ms to 12 ms.
- **No closure per ring in `detectClosest`.** `tsx` wraps every function it creates, so closures made in a hot loop are slow in the headless runner.
- **Only the sensors a brain reads are computed.** A brain with no prey sensor and no MoveToPrey never searches. A brain that does not read Random draws no number.
- **Networks compiled into flat arrays.** Typed arrays were tried and were not faster, because brains have few connections.
- **A precomputed action list** was tried and measured as no gain (see [How to measure](#how-to-measure)).

## Options

Ranked by gain for the effort. "Same seeded results" means a run with the same seed gives exactly the same generations as before, which is the bar for a pure speed change.

| # | Option | Expected gain | Effort | Same seeded results |
|---|---|---|---|---|
| 1 | Genus map for the prey search | Search 2–4× faster, so about **1.5–1.8× overall** with hunters | ~2 h | Yes |
| 2 | Per-block genus counts | Large in sparse worlds, small in dense ones | ~4 h | Yes |
| 3 | Run seeds in parallel | **~8–10× more runs per hour** on this machine | ~1 h | Yes |
| 4 | Smaller `DETECT_RADIUS` | Up to ~3× on the search (radius 5 reads 120 cells, not 440) | None | No |
| 5 | Stamina | Proportional to the mean stamina | None | No |
| 6 | Stop at the first match in a ring | ~10–20 % on the search | Small | No |

### 1. Genus map for the prey search

Keep a flat `Int8Array` of `size × size` in `Grid`, holding a code for the genus of the creature in each cell (0 for empty). `detectClosest` then reads one number per cell, at `x * size + y`, instead of calling `grid.cell()`, reading `.creature` and comparing `_genus` strings. The result is the same creature in the same order, so seeded runs do not change.

The map must be updated wherever a creature enters or leaves a cell:
- `Grid.addCreature`
- `Grid.removeCreature`
- `Grid.clearCreatures`
- `Creature.move`, which writes `cell.creature` directly
- the death path in `Creature`, which clears its cell

The genus is set once, at birth (`Creature._genus`), so it never needs updating in place. Tests should check that the map matches `cell.creature` after moves, deaths, births, restarts and loading a file. The A/B check described below must show identical results.

### 2. Per-block genus counts

Split the world into blocks of, say, 8×8 cells and keep a count of creatures of each genus per block. The search skips any ring segment whose block has no creature of the prey genus.

- **Where it pays off:** sparse worlds, such as the 200×200 foraging runs with plants on 4 % of the cells. There, many searches reach the edge of the radius without finding anything.
- **Where it does not:** dense worlds, where the first ring or two already hold a prey.
- **Cost:** more code to keep in sync (the same sites as option 1).

Do it after option 1, and only if sparse worlds are still slow.

### 3. Run seeds in parallel

The engine is single-threaded and each run is independent. A small script (for example `scripts/sim-batch.ts`) could start N `npm run sim` processes with different seeds and wait for them. It gives the same output folders as now.

- **Gain:** with 20 hardware threads, about 8–10× more runs per hour; memory bandwidth limits it below 20×. Each run is not any faster.
- **Best for:** experiments that compare settings over several seeds, which is most of the research work in `experiments/`.
- **Risk:** none for the engine.

### 4–6. Options that change the results

These are settings or rule changes, not optimisations: seeded runs give different results afterwards.

- **4. Smaller `DETECT_RADIUS`.** The work grows with the square of the radius when no prey is near.
- **5. Stamina.** A creature searches only in the steps it thinks.
- **6. Stop at the first match in a ring.** Today the search scans the whole ring to keep the old tie-break (the last match in x-then-y order). Stopping early changes which prey is picked when several are at the same distance.

### Not worth it

- **Reusing the previous step's prey.** A closer prey may have appeared, so the search has to run anyway.
- **Compiling the runner instead of `tsx`.** With inlining on, the `tsx` export getters do not show up in the profile.
- **Further network optimisation.** It is already compiled, and typed arrays did not help.

## How to measure

**Profiling.** Run the headless runner under the V8 profiler, once with inlining and once without:

```bash
node --cpu-prof --cpu-prof-dir=<dir> --import tsx scripts/sim.ts <config> --generations 15 --seed 1
node --cpu-prof --cpu-prof-dir=<dir> --no-turbo-inlining --no-maglev-inlining --import tsx scripts/sim.ts <config> --generations 15 --seed 1
```

- **With inlining:** the profile shows the real split, but inlined callees are counted in their caller.
- **Without inlining:** it shows what is inside a hot function. `get helpers.ts`, `get random.ts` and similar entries are `tsx` export getters, which do not exist in the Next.js build.
- **Line numbers:** under `tsx` every function reports line 2, so read the function names, not the lines.
- **Choose a scenario that exercises the code you change.** For the prey search, the animals must survive and read prey sensors or use MoveToPrey: check `nextAttackPlants` in `generations.csv`.

**Checking that results do not change.** Compare `generations.csv` without the `durationMs` column. In `final.sim`, ignore `simCode`, `lastGenerationDuration` and `totalTime`: `simCode` is not drawn from the seeded generator, so it differs even between two runs of the same code.

**Timing a change.** A single run varies by about ±5–6 %. To get a reliable comparison:

1. Make a detached `git worktree` of the baseline commit.
2. Link the project's `node_modules` into it with a directory junction (on Windows, `New-Item -ItemType Junction` from PowerShell).
3. Alternate baseline and change over several seeds, and compare pairs with the same seed.
4. Trust only differences larger than about twice their standard deviation.
5. To clean up, remove the junction first (`cmd /c rmdir <worktree>\node_modules`), then `git worktree remove`. With the junction still there, `git worktree remove --force` empties the project's `node_modules`.

A change that alters how many random numbers are drawn sends a seed down a different path. Time it by resuming the same saved world for one generation over several seeds, not by comparing whole runs.
