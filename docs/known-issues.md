# Known issues and to-do

This is a hobby project, built for fun and to learn new technologies. Expect some rough edges.

## Known bugs

Checked against the code in October 2026. Each item links to the page that explains it.

### Simulation

| Bug | Effect | Details |
|---|---|---|
| **Reproduction never succeeds without metabolism** | It needs more than 3 × birth mass, and without metabolism mass never changes. | [Creatures](model/creatures.md#reproduction) |
| **PredatorDistance and PredatorDirection produce no value** | They are disabled by default. If you enable them, genes that read them make the brain compute `NaN`. | [Sensors and actions](reference/sensors-and-actions.md#known-issues) |
| **Health areas have no effect** | The call that applies them is commented out in `WorldGenerations.step()`, so the Pain sensor is always 0. | [World](model/world.md#objects-and-areas) |
| **Greatest Distance can select dead creatures** | It does not check `isAlive`. | [Population and selection](reference/population-and-selection.md#known-issues) |
| **Asexual Zone ignores the spawn area** | Only when there are more survivors than Initial population. | [Population and selection](reference/population-and-selection.md#known-issues) |
| **Update simulation while paused runs one step** | `resumeRun` restarts the loop, and the pause is applied again after the first step. |  [Architecture](development/architecture.md#ui--engine-applying-settings) |

### User interface

| Bug | Effect | Details |
|---|---|---|
| **The map editor can start empty** | It restores a saved map from local storage, which is an empty list the first time. Click **Reset Designer**. | [Map editor](user/map-editor.md#applying-the-map) |

### Tooling

| Bug | Effect | Details |
|---|---|---|
| **16 tests fail in `EventLogger.test.ts`** | The logger records fewer events than the tests expect. The cause has not been investigated. | [Testing](development/testing.md#current-status) |

### Older reports, not re-checked

- Strange behaviour of the speed controls after a restart. A likely cause: the control bar keeps its own values in Jotai atoms, and loading a file does not update them.
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

## Done

These items were on the old list, or found while writing these docs, and are now fixed:

- Saving a simulation without its creatures: **My scenarios** in the Files tab saves the setup, or the genomes at the start of a generation.
- **Update simulation** after loading a file set the stats history back to the one in the file. Loading a file without stats kept the history of the previous run.
- **Save to file** can leave out the stats history.
- **Save to file** wrote the generation, step and simulation code from load time instead of the current ones. It also saved each creature's position from the previous step, and loading ignored the saved mass.
- **Update simulation** and **Use Map** keep the running creatures. They used to lose them, or put back the population from load time. Creatures restored from a file now use the new grid and settings.
- Selected creature information in the Population tab: identity, life, body, movement and brain, updated at every step, in collapsible sections
- The population percentage of a species was divided by Initial population instead of the creatures alive
- The default `REPRODUCTION_MULTIPLE_MASS_AT_BIRTH` was 300 instead of 3. It was above the maximum mass (10 × birth mass), so the Reproduction action could never succeed with the default settings
- Buttons in the Population tab to go through the creatures of a species, select the parent, and log the selected creature
- Life history of each creature (parent, children, attacks, kills, photosynthesis, cause of death), shown in the Population tab
- Showing the brain of a species, as a structure diagram, with live values and an influence table
- Saving the metabolism parameters in the save file
- Logging a single creature (*Stats → Logger → Creature to log*)
- Consistent styling and status messages for log, save, load and GIF
- A metabolic cost for brain size (`MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE`)
- Water accounting with metabolism. Several leaks made `waterInCreatures` drift until the simulation stopped with a `dissipateWater` error: failed attempts could take more mass than the creature had, the child's mass on reproduction went to the cloud, photosynthesis lost the water above the maximum mass, attackers gained mass that also went back to the cell, and new generations had mass that was not counted.
- Continuous runs are now a **Simulation type** instead of a population strategy and a selection method. This fixes the old Continuous strategy: it broke in generation 1, it dropped every creature not born in the current generation, and old age never applied.
- The Initial population field no longer accepts World size², which the engine refuses. Its maximum is size² − 1.
- `npm run lint` works again and reports nothing. It runs the ESLint CLI with `eslint.config.mjs`, because Next.js 16 removed `next lint`. The UI code now follows the React Compiler rules of `eslint-config-next` 16: for example, the map designer drags objects from pointer events instead of an effect, and edits clones instead of the objects in the atom.
- Greatest Mass no longer crashes when no herbivores are left. It returns no survivors, and with Plant/Herbivore the next generation has only plants.

## Ideas

- Does a metabolic cost for brain size lead to smaller networks?
- Phylogenetic tree
- Diversity graph: the number of species in each generation
