# Known issues and to-do

This is a hobby project, built for fun and to learn new technologies. Expect some rough edges.

## Known bugs

Checked against the code in October 2026. Each item links to the page that explains it.

### Simulation

| Bug | Effect | Details |
|---|---|---|
| **Reproduction never succeeds without metabolism** | It needs more than 3 × birth mass, and without metabolism mass never changes. | [Creatures](model/creatures.md#reproduction) |
| **PredatorDistance and PredatorDirection produce no value** | Enabling either one misaligns every sensor after it. | [Sensors and actions](reference/sensors-and-actions.md#known-issues) |
| **Health areas have no effect** | The call that applies them is commented out in `WorldGenerations.step()`, so the Pain sensor is always 0. | [World](model/world.md#objects-and-areas) |
| **Continuous population is broken in generation 1** | It passes a `{genus, probability}` object where a genus name is expected. | [Population and selection](reference/population-and-selection.md#known-issues) |
| **Greatest Mass crashes without herbivores** | It reads `parents[0]` without checking that it exists. | [Population and selection](reference/population-and-selection.md#known-issues) |
| **Greatest Distance can select dead creatures** | It does not check `isAlive`. | [Population and selection](reference/population-and-selection.md#known-issues) |
| **Asexual Zone ignores the spawn area** | Only when there are more survivors than Initial population. | [Population and selection](reference/population-and-selection.md#known-issues) |
| **Update simulation while paused runs one step** | `resumeRun` restarts the loop, and the pause is applied again after the first step. |  [Architecture](development/architecture.md#ui--engine-applying-settings) |
| **Initial population = World size² is rejected** | The Settings field allows it, but the engine throws an error. | [Parameters](reference/parameters.md#world) |

### User interface

| Bug | Effect | Details |
|---|---|---|
| **The map editor can start empty** | It restores a saved map from local storage, which is an empty list the first time. Click **Reset Designer**. | [Map editor](user/map-editor.md#applying-the-map) |

### Tooling

| Bug | Effect | Details |
|---|---|---|
| **16 tests fail in `EventLogger.test.ts`** | The logger records fewer events than the tests expect. The cause has not been investigated. | [Testing](development/testing.md#current-status) |
| **`npm run lint` fails** | It calls `next lint`, which Next.js 16 removed. | [Developer guide](development/README.md#setup) |

### Older reports, not re-checked

- Strange behaviour of the speed controls after a restart. A likely cause: the footer keeps its own values in Jotai atoms, and loading a file does not update them.
- Tabs not refreshing on a simulation restart.
- A `removeCreature` error on restart.

## To be completed

- During the simulation
  - "Radiation" button to force an extra level of mutation
- Predator–prey model
  - Continuous simulation of plants and herbivores
  - Log and plot accumulated biomass and grid water per generation
  - Genus evolution graph
  - Fitness values for continuous simulation
- Log
  - Choose log settings from the UI
  - Complete the Power BI report that analyses the log (`public/analyze simlog.pbix`)
- Other
  - Remove the Google Analytics and Clarity tags
  - Option to save a simulation without its creatures

## Done

These items were on the old list, or found while writing these docs, and are now fixed:

- **Update simulation** and **Use Map** keep the running creatures. They used to lose them, or put back the population from load time. Creatures restored from a file now use the new grid and settings.
- Selected creature information in the Population tab
- Showing the brain of a species, as a structure diagram, with live values and an influence table
- Saving the metabolism parameters in the save file
- Logging a single creature (*Stats → Logger → Creature to log*)
- Consistent styling and status messages for log, save, load and GIF
- A metabolic cost for brain size (`MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE`)

## Ideas

- Does a metabolic cost for brain size lead to smaller networks?
- Phylogenetic tree
- Diversity graph: the number of species in each generation
