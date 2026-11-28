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

Each snapshot or recording is downloaded as three or four files with the same name and a different ending:

| File | Content |
|---|---|
| `sim <code> log <gens> settings.csv` | The options of the log and the settings and constants of the simulation when it started |
| `sim <code> log <gens> species.csv` | One row per species, with **Species** on (`LOG_SPECIES`, default on) |
| `sim <code> log <gens> creatures.csv` | One row per creature, with **Creatures** on (`LOG_CREATURES`, default off) |
| `sim <code> log <gens>.sim` | The simulation when the files were saved, as the Save tab saves it (without stats). For a recording stopped by a restart, a loaded file or an extinction, the running simulation is another run: the `.sim` is then the recorded one as it was just before (after an extinction, with no creatures left). It is missing only when the restart or load came during the pause between generations, when the world is half way. It can be loaded in the app or opened in the energy lab page (`/energy-lab.html`) |

The settings file has the configuration when the recording started and the `.sim` the one when it was saved: they differ if the constants were changed in between. The headless runner does not write this `.sim`: with `--log` it already writes `final.sim`.

`<code>` is the simulation code; for a recording, the code of the run when it started, also after a restart or **Continue recording**. `<gens>` is the generation and step of a snapshot (`57 step 120`) or the first and last generation of a recording (`1-200`).

The CSV files are plain UTF-8 text:

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
| `genus` | `plant`, `attack_plant` or `unknown` |
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
| `avgChildren`, `avgPlantKills`, `avgAnimalKills`, `avgAttacks`, `avgPhotosynthesis`, `avgFromPlants`, `avgFromAnimals` | Averages per creature, of the living and the ones that died in the generation. Kills and food are split by the genus of the prey: `avgPlantKills` and `avgFromPlants` for plants, `avgAnimalKills` and `avgFromAnimals` for other animals |
| `avgMassStart` … `avgMassEnd` | Average of each line of the mass balance, as in *Species stats*: start, photosynthesis, from plants, from animals, basal, thinking, moving, attacking, reproduction cost, given to children, end |
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
| `distanceCovered`, `stepsStopped` | Distance index of *Greatest Distance* and steps without moving since its last move (0 right after a move) |
| `canMove`, `canReproduce` | Enough mass to move or reproduce |
| `stamina` | Share of the steps in which its brain runs |
| `children`, `plantKills`, `animalKills`, `attacks`, `thinkCount` | Counters since birth; kills are split by the genus of the prey |
| `waterFromPhotosynthesis`, `waterFromPlants`, `waterFromAnimals` | Mass gained by each way since birth: photosynthesis, eating plants and eating other animals |
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

The app draws it in the **species tree** page (`/species-tree.html`, linked from *Simulation → Log*; the code is [public/species-tree.html](../../public/species-tree.html)). Open a species file in it, or drop the file on it:

- **Run** chooses the simulation code when the file has several runs (after extinctions).
- **Thickness**: `alive` at each row, or `peakAlive`.
- **Hide species with fewer than** *n* creatures at their peak (default 5). With **add hidden species to their visible ancestor** their creatures are added to the band of their nearest shown ancestor, so the bands keep the whole population.
- **Scale**, **Colour** (genus or genome colour) and **lines to the parent**.
- Hover a band to see the species; click it to highlight its ancestors and descendants and open its details: in a side panel next to the tree on wide screens (1100 px or more), below the tree otherwise. Drag the bar between the tree and the side panel (or focus it and use the arrow keys) to change their widths; the page remembers the width, and a double-click on the bar goes back to the default. **Find species** opens a species by the start of its id, also one hidden by the filter. **Close** or Esc clears it.
- The details show everything the file has about the species:
  - **Identity**: genus, genome colour, genes, `firstGen`, its first and last row, and how many rows and generations it has.
  - **Lineage**: the species it came from, all its ancestors, the species it gave (most numerous first) and how many descendants it has. Each id opens that species.
  - **Over its life**: most creatures at once, creatures born and died (summed from the last row of each generation), the average age at death and the share of each cause of death, weighted by the deaths of each generation.
  - Sensors and actions used, the genome and, with `aliveCreatures`, the creatures alive in its last row. **Copy** copies the id or the genome.
  - **The same in every row**: the columns whose value never changes.
  - **Over time**: a chart of one column. **Every row**: a table of the other columns, one row per row of the file. Clicking a column header draws it; clicking it again sorts the table by it.
  - **Download its rows** saves the rows of the species, with every column, as a CSV.

The page loads a file served by the app with `?csv=/<path>`, for example a file copied to `public/`.

## Analysis report

The **log report** page (`/log-report.html`, linked from *Simulation → Log*; the code is [public/log-report.html](../../public/log-report.html)) shows why some species do better than others and which settings hold back more complex brains.

- Choose the files of one log, or drop them on the page all at once. It tells them apart by the end of their names: `species.csv` (needed), `settings.csv` (needed to decode the genomes) and `creatures.csv` (optional). They work with the names of the app and of the headless runner (`log-species.csv`…). The files are read in the browser. The creatures file is read a piece at a time, so files of hundreds of MB work.
- **Run** chooses the run when the log has several (after extinctions). It starts with the longest.
- A species counts as **relevant** from a peak of 5 creatures; the page can change that.
- **Download species summary** saves one row per species with its totals and its decoded circuit.
- `?species=/<path>` loads a species file served by the app, and the settings and creatures files with the same name next to it.

The report has these sections:

- **Settings** of the run.
- **Diagnosis**: rules on the last third of the generations that point to the settings to change.
- **Population** of each genus.
- **Most successful species**, measured four ways: duration, creatures × generations, peak, and clade (the species and all its descendants).
- **Successful, relevant and ephemeral species compared**: brain, mass gained and spent, children, causes of death.
- **Mutations that work**: each daughter species compared with its parent.
- **Changes of the dominant species**.
- **Complexity over time**: genes, connections left after pruning, internal neurons, share of environment and clock sensors, and number of distinct behaviours.
- **Mass balance** of the main species.
- With the creatures file, **who eats whom** and the **variation within species**.

The genomes are decoded and pruned as `CreatureBrain` does, with the sensors, actions and Max neurons of the settings file. Genomes written after a change of these during the recording are decoded wrongly.
