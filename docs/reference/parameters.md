# Parameters reference

Every value that defines a simulation lives in a `SimulationData` object ([simulation/SimulationData.ts](../../simulation/SimulationData.ts)). It has five parts:

| Part | Type | What it holds |
|---|---|---|
| `worldControllerData` | [WorldControllerData](../../simulation/world/WorldControllerData.ts) | World size, generation length, speed, metabolism constants, run state |
| `worldGenerationsData` | [WorldGenerationsData](../../simulation/generations/WorldGenerationsData.ts) | Population, selection, genome, mutations, sensors, actions |
| `waterData` | [WaterData](../../simulation/water/WaterData.ts) | Water and rain (under development) |
| `worldObjects` | `WorldObject[]` | The map: obstacles and areas (see the Map tab) |
| `constants` | object | Advanced options that are not shown in the UI |

The **Startup** column below shows the values loaded when the app opens ([simulation/startupScenario.ts](../../simulation/startupScenario.ts)). Loading a scenario from the **Start** tab or a file from the **Files** tab replaces all of them.

## How changes are applied

The **Settings** tab edits a draft. The running simulation keeps its own copy until you apply the draft with one of these buttons:

- **Update simulation** applies the changes and keeps the generation number and stats. It does not currently keep the running creatures (see [Settings and stats](../user/settings-and-stats.md#applying-changes)).
- **Restart** applies the changes and starts again from generation 1. All evolution so far is lost.
- **Discard changes** puts the draft back to the values of the running simulation.

## Settings tab

### World

| UI label | Key | Allowed values | Startup | Notes |
|---|---|---|---|---|
| Simulation code | `worldControllerData.simCode` | read-only | `SC1` | Assigned by the system. Used in file names. |
| Phenotype mode | `worldGenerationsData.phenotypeColorMode` | read-only: `genome`, `trophicLevel` | `genome` | How creatures are coloured. `genome`: colour from the genome, so each species has its own colour. `trophicLevel`: green for plants, blue for herbivores, red for carnivores. Set by the scenario. |
| Metabolism | `worldGenerationsData.metabolismEnabled` | read-only | `false` | When off, creature mass never changes. Set by the scenario. |
| World size | `worldControllerData.size` | integer, 10–1000 | 100 | The world is a square grid of `size × size` cells. |
| Initial population | `worldGenerationsData.initialPopulation` | integer, 1 – size² − 1 | 1000 | Number of creatures created in each generation. Each creature needs its own cell. The field accepts size², but the engine refuses it (known issue). |
| Steps per generation | `worldControllerData.stepsPerGen` | integer ≥ 1 | 300 | Steps that make up one generation. |

### Generations

| UI label | Key | Allowed values | Startup |
|---|---|---|---|
| Population strategy | `worldGenerationsData.populationStrategy` | see [Population strategies](population-and-selection.md#population-strategies) | Asexual Random |
| Selection method | `worldGenerationsData.selectionMethod` | see [Selection methods](population-and-selection.md#selection-methods) | Inside Reproduction Area |

### Neural networks

| UI label | Key | Allowed values | Startup | Notes |
|---|---|---|---|---|
| Initial genome size | `worldGenerationsData.initialGenomeSize` | integer, 1 – max genome size | 4 | Number of genes in the random genomes of generation 1. Each gene is one connection in the brain. |
| Max genome size | `worldGenerationsData.maxGenomeSize` | integer ≥ initial genome size | 4 | Insertion mutations cannot grow a genome beyond this size. |
| Max neurons | `worldGenerationsData.maxNumberNeurons` | integer ≥ 1 | 1 | Number of internal (hidden) neurons a gene can point to. |

### Mutations

Every time a child is created from a parent, its genome is copied and may mutate.

| UI label | Key | Allowed values | Startup | Notes |
|---|---|---|---|---|
| Mutation mode | `worldGenerationsData.mutationMode` | `wholeGene`, `singleBit`, `singleHexDigit` | `wholeGene` | What a mutation changes in a randomly chosen gene: the whole gene, one of its 32 bits, or one of its 8 hexadecimal digits. |
| Mutation probability (0 - 1) | `worldGenerationsData.mutationProbability` | 0–1 | 0.05 | Chance that a child has one mutated gene. |
| Insertion/Deletion probability (0 - 1) | `worldGenerationsData.geneInsertionDeletionProbability` | 0–1 | 0.015 | Chance that a child gains or loses one gene. |
| — | `worldGenerationsData.deletionRatio` | 0–1 | 0.5 | Not in the UI. Share of insertion/deletion events that are deletions. |

### Sensors and actions

One checkbox for each [sensor](sensors-and-actions.md#sensors) (`worldGenerationsData.enabledSensors`) and each [action](sensors-and-actions.md#actions) (`worldGenerationsData.enabledActions`). At least one of each must stay enabled.

The startup scenario enables the first 10 sensors (positions, age, oscillator, random, speeds and border distances) and the six movement actions.

> **Changing sensors or actions changes the meaning of existing genes.** Genes point to sensors and actions by their position in the list of enabled items. If you enable or disable one and click **Update simulation**, the creatures keep their genes, but those genes now connect different inputs and outputs.

### Under development: water

| UI label | Key | Startup | Notes |
|---|---|---|---|
| Cell water capacity | `waterData.waterCellCapacity` | 400 | Maximum water one cell can hold. |
| Total water (per cell) | `waterData.waterTotalPerCell` | 130 | Total water in the world, expressed per cell. |
| Rain max per cell | `waterData.waterRainMaxPerCell` | 0 | Maximum rain one cell receives in one generation. |
| Initial water per cell | `waterData.waterFirstRainPerCell` | 50 | Water in each cell when the simulation starts. |
| Evaporation | `waterData.waterEvaporationPerCellPerGeneration` | 0 | Water lost by each cell in each generation. |
| Rain type | `waterData.rainType` | `rainTypeUniform` | How rain is spread over the map: `rainTypeUniform`, `rainTypeUniformNE` or `rainTypeSinSin`. |

Water only matters when metabolism is on and creatures use the **Photosynthesis** action.

## Footer: speed controls

These controls change the running simulation immediately. They are saved with the simulation.

| Control | Key | Options | Startup | Effect |
|---|---|---|---|---|
| Pause between steps (ms) | `worldControllerData.pauseBetweenSteps` | 0, 10, 50, 200 | 10 | Wait after each batch of steps. |
| Pause between generations (ms) | `worldControllerData.pauseBetweenGenerations` | 0, 1000, 4000 | 0 | Wait at the end of each generation. |
| Immediate steps | `worldControllerData.immediateSteps` | 1, 20, 200 | 1 | Steps computed before the canvas is redrawn. Use 200 to run at full speed. |

## Not in the UI

You can change these values only by editing a saved simulation file and loading it again.

### Metabolism constants (`worldControllerData`)

Mass is only consumed when metabolism is enabled. The mass thresholds ("needs more than…") are always checked for reproduction, and only with metabolism for moving and attacking. "Birth mass" means the creature's own mass at birth.

| Key | Startup | Meaning |
|---|---|---|
| `MASS_WATER_TO_MASS_PER_STEP` | 0.30 | Water a creature takes from its cell in one photosynthesis step, multiplied by the action's output. |
| `MASS_AT_BIRTH_PLANT` | 1 | Birth mass of a plant. |
| `MASS_AT_BIRTH_ATTACK_PLANT` | 2 | Birth mass of a herbivore. |
| `MASS_AT_BIRTH_ATTACK` | 2 | Birth mass of the old "attack" genus (no longer used). |
| `MASS_AT_BIRTH_ATTACK_ANIMAL` | 3 | Birth mass of a carnivore. |
| `MASS_MAX_MULTIPLE_MASS_AT_BIRT` | 5 | Maximum mass, as a multiple of birth mass. |
| `MASS_COST_PER_EXECUTE_ACTION` | 0.01 | Mass spent per step for each enabled action. |
| `MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE` | 0.04 | Mass spent per step for each gene in the genome. |
| `REPRODUCTION_MULTIPLE_MASS_AT_BIRTH` | 3 | A creature needs more than this multiple of its birth mass to reproduce (plus `REPRODUCTION_COST_PER_MASS_DO` with metabolism). |
| `REPRODUCTION_COST_PER_MASS_TRY` | 0.1 | Mass lost by a failed reproduction attempt, as a multiple of birth mass. |
| `REPRODUCTION_COST_PER_MASS_DO` | 0.25 | Mass lost by reproducing, as a multiple of birth mass. The parent also gives its birth mass to the child. |
| `MOVE_MULTIPLE_MASS_AT_BIRTH` | 2 | A creature needs more than this multiple of its birth mass (plus `MOVE_COST_PER_MASS_DO`) to move. |
| `MOVE_COST_PER_MASS_TRY` | 0.2 | Mass lost by trying to move, as a multiple of birth mass. |
| `MOVE_COST_PER_MASS_DO` | 0.6 | Extra mass lost by moving, as a multiple of birth mass. |
| `ATTACK_MULTIPLE_MASS_AT_BIRTH` | 3 | A creature needs more than this multiple of its birth mass (plus `ATTACK_COST_PER_MASS_DO`) to attack. |
| `ATTACK_COST_PER_MASS_TRY` | 0.4 | Mass lost by trying to attack. |
| `ATTACK_COST_PER_MASS_DO` | 0 | Mass lost by a successful attack. |
| `ATTACK_MIN_PREY_MASS_FACTOR` | 2 | An attack fails unless the attacker weighs at least this many times the prey's mass. |
| `ACTION_REPRODUCTION_OFFSET` | 0.6 | Despite its name, the minimum neuron output that triggers the attack actions. |

### Run state (`worldControllerData`, `worldGenerationsData`)

The simulation writes these values itself so that a saved file can resume where it stopped. Do not edit them by hand.

`currentGen`, `currentStep`, `lastGenerationDuration`, `totalTime`, `lastCreatureIdCreated`, `lastCreatureCount`, `lastSurvivorsCount`, `lastFitnessMaxValue`, `lastSurvivalRate`.

### Other constants (`constants`)

| Key | Startup | Meaning |
|---|---|---|
| `DETECT_RADIUS` | 10 | Radius, in cells, of the prey sensors. |
| `GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS` | 0.05 | Share of creatures selected by Greatest Distance. |
| `GREATEST_MASS_SELECTION_TOP_SURVIVORS` | 0.05 | Share of creatures selected by Greatest Mass. |
| `POPULATION_DEFAULT_GENUS` | `[]` | List of `{genus, probability}` used by the Random Fixed Gene and Continuous strategies. |
| `PRETTIFY_OUTPUT_TO_COPY`, `PRETTIFY_OUTPUT_TO_FILE` | `true` | Indent the JSON of saved simulations. |
| `LOG_*` | — | Event logger settings: on/off switch, level, creature filter, event limit and event types. |
| `colors` | — | Colours of map areas: reproduction, obstacle, healing, danger and spawn. |
| `SIM_CODE_LENGTH` | 3 | Length of the generated simulation code. |
