# The log files

The log (*Simulation → Log*) saves tables of species and creatures, one row per species or creature each time it is written, as CSV files. This page describes the files and every column. How to use it from the UI is in [Scenario, simulation and tools](../user/settings-and-stats.md#log). The code is in [SimulationLog.ts](../../simulation/log/SimulationLog.ts) and [logRows.ts](../../simulation/log/logRows.ts).

## Species

A **species** is a lineage: a genome together with the species it came from ([speciesId.ts](../../simulation/creature/speciesId.ts)).

- A creature born with exactly the genome of its parent keeps the species of its parent.
- A creature born with another genome (a mutation, or the Stamina gene added to an older genome) starts a new species. Its `speciesId` is a 64-bit hash of its genes and the `speciesId` of its parent's species, written as 16 hexadecimal digits, and its `speciesParentId` is the species of its parent.
- A creature without a parent (a random or fixed genome, generation 1, **Save generation** files) starts a root species: the hash of its genes alone, with an empty `speciesParentId`.

So the same genome reached by mutation from two different species is two species, and every species has exactly one parent species. If the same species produces the same mutated genome twice, both share the id, as they cannot be told apart.

The id draws no random numbers, so a seeded run gives the same ids every time. Creatures keep their species when saved and loaded (`.sim` files save each species' `id`, `parentId` and `firstGen`); species of files saved before this are loaded as roots. The Population tab groups the creatures by this id too.

## The files

Each snapshot or recording is downloaded as two or three files with the same name and a different ending:

| File | Content |
|---|---|
| `sim <code> log <gens> settings.csv` | The options of the log and the settings and constants of the simulation when it started |
| `sim <code> log <gens> species.csv` | One row per species, with **Species** on (`LOG_SPECIES`, default on) |
| `sim <code> log <gens> creatures.csv` | One row per creature, with **Creatures** on (`LOG_CREATURES`, default off) |

`<code>` is the simulation code. `<gens>` is the generation and step of a snapshot (`57 step 120`) or the first and last generation of a recording (`1-200`).

All files are plain UTF-8 text:

- The separator is `;` and the first line is the header.
- Numbers use the locale in **Number format** (`LOG_LOCALE_STRING`, default `es-ES`): with `es-ES` the decimal separator is a comma, with `en-US` a point. There is no thousands separator. Rows have at most 4 decimals; the settings file has up to 10.
- `true`/`false` values are written as `1`/`0`. An empty cell means "none" or "not known".

## When rows are written

- **Save snapshot** writes the state at that moment: the species seen in the current generation and the living creatures, plus, with **Creatures: also the dead**, the creatures that died in the current generation.
- A **recording** writes rows at the end of every generation, while its creatures are still in the world (before the selection of survivors), and also every **Also every** steps (`LOG_EVERY_N_STEPS`, default 0: only at the end of each generation). When every creature dies, it writes the rows of that step before the run restarts. In continuous runs the end of a generation is the end of each time window.
- A recording keeps the options it started with: **Files**, **Which ones**, the columns and the locale. A change applies to the next recording.
- A recording stops when it has **Maximum rows** (`LOG_MAX_ROWS`, default 1,000,000) rows of species and creatures, or when the simulation is restarted or another one is loaded. **Continue recording** goes on with it after a restart, adding rows that start again at generation 1. **Update simulation** does not stop it.

With **Which ones** set to **Marked in Population**, the file of species has only the marked species, and the file of creatures has the marked creatures and the creatures of the marked species.

The log only reads the world. It does not change the simulation nor use random numbers, so a run gives the same results with or without it.

## Species file

A species gets a row in every recording of every generation in which it lived, **also after it died out within that generation**: the engine remembers the species seen in the current generation ([SpeciesRegistry.ts](../../simulation/generations/SpeciesRegistry.ts)) and forgets the extinct ones when the next generation starts. So a recording from generation 1 has every species and its parent, and the tree of species can be drawn from it (see [below](#drawing-the-tree-of-species)).

| Column | Content |
|---|---|
| `simCode`, `generation`, `step` | Simulation code, generation and step of the row |
| `speciesId` | Id of the species (16 hexadecimal digits) |
| `speciesParentId` | Species it came from; empty for a root |
| `firstGen` | Generation in which it appeared. Only approximate for species loaded from files saved before species ids existed. |
| `genus` | `plant`, `attack_plant`, `attack_animal` or `unknown` |
| `genomeColor` | Colour code of the genome, as shown in the Population tab. Not unique. |
| `genomeSize` | Number of genes |
| `usedSensors`, `usedActions` | Sensors and actions its network uses, separated by `\|` |
| `alive` | Creatures alive at that moment |
| `percentOfPopulation` | `alive` as a percentage of all the living creatures |
| `peakAlive` | Most creatures alive at once during the generation |
| `started` | Creatures it had when the generation (or time window) started |
| `born` | Creatures born since then |
| `died` | Creatures that died since then |
| `avgAge`, `avgMass`, `avgHealth`, `avgDistance`, `avgStepsStopped` | Averages of the living; empty when none is alive |
| `pctCanMove`, `pctCanReproduce` | Share of the living with enough mass to move or reproduce (0 to 100) |
| `avgChildren`, `avgKills`, `avgAttacks`, `avgPhotosynthesis`, `avgFromPrey` | Averages per creature, of the living and the ones that died in the generation |
| `avgMassStart` … `avgMassEnd` | Average of each line of the mass balance, as in *Species stats*: start, photosynthesis, from prey, basal, thinking, moving, attacking, reproduction cost, given to children, end |
| `avgAgeAtDeath` | Average age of the ones that died in the generation |
| `pctDeathOld`, `pctDeathBasalConsumption`, `pctDeathAttacked`, `pctDeathHealth` | Share of the deaths of each cause; empty without deaths |
| `aliveCreatures` | Keys of its living creatures, separated by `\|`; only with **Species: list of living creatures** (`LOG_SPECIES_CREATURE_LIST`) |
| `genome` | The genome in hexadecimal, one 8-digit gene per group, as copied in the Population tab |

Rows are ordered by `alive`, the largest first.

## Creatures file

| Column | Content |
|---|---|
| `simCode`, `generation`, `step` | Simulation code, generation and step of the row |
| `creatureKey` | `<birthGen>-<id>`: unique in a run, since most selection methods give the ids again every generation |
| `id`, `birthGen`, `stepBirth` | Id, generation and step of birth |
| `speciesId`, `speciesParentId` | Its species and the species that species came from |
| `genus`, `genomeColor` | As in the species file |
| `parentKey` | `creatureKey` of its parent; empty without a parent |
| `spawnZone` | Spawn area of its lineage; empty without one |
| `alive` | `1` alive, `0` dead |
| `age`, `mass`, `massAtBirth`, `health` | Mass is 0 once dead |
| `x`, `y` | Position |
| `lastMoveX`, `lastMoveY`, `lastDirection` | Last move (−1, 0 or 1 on each axis) and its direction (`N`, `NE`…) |
| `distanceCovered`, `stepsStopped` | Distance index of *Greatest Distance* and steps without moving |
| `canMove`, `canReproduce` | Enough mass to move or reproduce |
| `stamina` | Share of the steps in which its brain runs |
| `children`, `kills`, `attacks`, `thinkCount` | Counters since birth |
| `waterFromPhotosynthesis`, `waterFromPrey` | Mass gained by each way since birth |
| `massStart` … `massEnd` | Its mass balance (see [Creatures](../model/creatures.md)) |
| `deathCause`, `deathGen`, `deathStep`, `killedBySpecies` | Empty while alive. `killedBySpecies` is the `speciesId` of the killer. |
| `genomeSize`, `usedSensors`, `usedActions` | As in the species file |
| `genome` | Only with **Creatures: genome** (`LOG_CREATURE_GENOME`) |

With **Creatures: also the dead** (`LOG_INCLUDE_DEAD`, default on), a recording writes each creature that died once, in the first row block after its death, with `alive` 0. A snapshot writes every creature that died in the current generation.

## Settings file

Columns `kind;name;value;text`. Numbers and true/false values go to `value`; text goes to `text`, with `value` 0.

1. `LOG` rows: `formatVersion` (1), `startGen` and `startStep` of the log, `scope` (`all` or `marked`) and the `LOG_*` options.
2. `SETTING` rows, the values of the Scenario and Simulation tabs: `simCode`, `phenotypeColorMode`, `metabolismEnabled`, `size`, `initialPopulation`, `stepsPerGen`, `seed` (`random` when it is not fixed), `runSeed` (the seed this run uses), `simulationType`, `maxAge`, `populationStrategy`, `selectionMethod`, `initialGenomeSize`, `maxGenomeSize`, `maxNumberNeurons`, `mutationMode`, `mutationProbability`, `geneInsertionDeletionProbability`, `deletionRatio`, one `sensor.<name>` and `action.<name>` row per sensor and action ([table order](sensors-and-actions.md), 1 enabled, 0 not), and the six water settings.
3. `CONSTANT` rows: the upper case values of `worldControllerData` (`MASS_*`, `REPRODUCTION_*`, `MOVE_*`, `ATTACK_*`…) and everything in `constants`. Nested values get a path, such as `colors.obstacle`.

The values are those of the running simulation when the recording started (for a snapshot, when it was taken).

## Drawing the tree of species

A timeline where each species is a line, as thick as its creatures, branching from its parent species. It needs a recording of the species from generation 1 (**From**: *Generation 1*) with **Which ones**: **All**:

- x axis: `generation`; one line per `speciesId`; thickness: `alive` (or `peakAlive`).
- The branch starts at the line of `speciesParentId`, at `firstGen`, and ends at the last row of the species.
- With **Marked in Population** intermediate species are missing and the tree breaks. Species that existed before the recording started are roots whose parent has no row.
- Every mutation makes a species, so most species have one or two creatures and live a generation. Filter them when drawing (for example `peakAlive` of at least 5), and hang the branches of the hidden ones on their nearest visible ancestor, going up `speciesParentId`.
- In continuous runs, use the time windows as generations, or **Also every** steps with `step` for a finer x axis.

Power BI has no chart of this kind; it is easy to draw with Python (matplotlib or plotly) or a web page.
