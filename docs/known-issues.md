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
| **The prey sensors never see the last row and column** | The search area is clamped to `size − 1` and then used as an exclusive end, so a prey at `x = size − 1` or `y = size − 1` is not detected. | [Sensors and actions](reference/sensors-and-actions.md#known-issues) |
| **Plants with prey sensors detect any creature** | Plants have no prey genus, so for them the prey sensors return the closest creature of any genus. | [Sensors and actions](reference/sensors-and-actions.md#known-issues) |
| **Files saved before October 2026 resume with young creatures and full cells** | They have no creature `age` and no `cellWater`. Every creature starts again at age 0 and every cell gets the first rain, so the first resumed generations of a continuous run have few deaths. Save the run again to get a file with both. | [Save format](development/serialization.md) |
| **Some older sample files do not match their genomes** | Genes address actions by position in the enabled list, so a file whose list changed after its creatures evolved runs different brains. `public/test.sim` and `public/sim H8U generation 176_small_for_test.sim` list `Attack`, which is now `AttackPlant` / `AttackAnimal`. Loading ignores the unknown name, so their brains have one action fewer than when they were saved. `public/plants_2024_05_19.sim` lists the removed `Touch` sensor. | [Sensors and actions](reference/sensors-and-actions.md) |
| **Files without `plantGenes` do not load** | The deserializer calls `JSON.parse` on the missing value and throws, in the app and in the headless runner. Example: `public/sim W19 generation 16_herbivores.sim`. | [Save format](development/serialization.md) |
| **Update simulation while paused runs one step** | `resumeRun` restarts the loop, and the pause is applied again after the first step. |  [Architecture](development/architecture.md#ui--engine-applying-settings) |

### User interface

| Bug | Effect | Details |
|---|---|---|
| **The map editor can start empty** | It restores a saved map from local storage, which is an empty list the first time. Click **Reset Designer**. | [Map editor](user/map-editor.md#applying-the-map) |

### Older reports, not re-checked

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
- Water accounting with the Reproduction selection method. It does not reset the world water between generations, so the water of the replaced creatures stayed counted and the mass of the new ones was not, and the simulation stopped with a `dissipateWater` error. The creatures' water is now recounted after repopulating.
- Water accounting on resume. **Update simulation** and resuming a file rebuild the world water, but the restored creatures kept their mass without counting it, so with metabolism on the simulation stopped with a `dissipateWater` error. Restored creatures now take their mass from the cloud, and the rounding error left when creatures use up all their mass is ignored.
- A random seed (`worldControllerData.seed`, `--seed` in the headless runner): every random decision of the engine comes from one seeded generator, and saved files keep its state. Before, the engine called `Math.random()` directly and no run could be repeated.
- Files that listed a sensor or action that no longer exists, or listed them out of table order, used that raw list to build the genes of genus-based creatures, while the brain used the filtered list in table order: those genes pointed at the wrong sensor or action. Both now use the filtered list.
- Plant/Herbivore no longer stops the simulation when it receives survivors that are not herbivores (selection methods other than Greatest Mass). It ignores them and logs a warning.
- The prey sensors were the slowest part of a step in crowded worlds: each creature listed every creature within `DETECT_RADIUS`, twice. They now share one search that goes ring by ring and stops at the closest match. With 8000 creatures a step went from about 145 ms to 12 ms. They detect exactly the same creatures as before.
- Herbivores could never attack, so they never reproduced: `ATTACK_MULTIPLE_MASS_AT_BIRTH` was 3, a herbivore is born with 1/3 of that mass and only gains mass by attacking. The parameter was removed: attacking needs no minimum mass.
- The attack actions targeted the first neighbour found in random order, even one of the same genus or too heavy to eat, and then failed. They now pick a neighbour that can be eaten.
- A creature without enough mass to reproduce lost `REPRODUCTION_COST_PER_MASS_TRY × birth mass` every step its Reproduction neuron fired, and the log row `REPRODUCE_TRY mass consumed` wrote 0.1 × its current mass instead of what it lost. Without enough mass the action now does nothing; `mass consumed` is written for attempts that find no room, with the mass actually lost.
- With no free cell around, a herbivore or carnivore ready to reproduce now eats a neighbour it can eat and puts its child in that cell.
- Greatest Mass no longer crashes when no herbivores are left. It returns no survivors, and with Plant/Herbivore the next generation has only plants.
- The logger settings can be changed from the UI (*Stats → Logger options*).
- With the logger level at *Step totals* or *Generation totals* (the default is *Step totals*), the step and generation totals were always empty: creature events were dropped before they were counted.
- Log totals of events with `_` in their name (`REPRODUCE_TRY`, `ATTACK_TRY`, `MOVE_TRY`, `DEAD_ATTACKED`) were written as `REPRODUCE;TRY sum` and so on, and the totals of `INFO … _energyConsumedByActionsExecution` lost their `ParamName`.
- The log wrote `GENERATION_START` twice from generation 2 on. It is now written once, at step 1.
- The log never wrote `BIRTH`. It is now written for every new creature, with the id and birth generation of its parent.
- The log wrote `MOVE position x + 100y` after failed moves too. It is now written only when the creature moved.
- 16 tests failed in `EventLogger.test.ts`. The logger was fine: the test never applied its own constants, so it ran with the default `LOG_LEVEL` (`STEP`), which drops creature events. It also changed `SIMULATION_DATA_DEFAULT` in place.
- `public/turn right generation 5574.sim` had lost `MoveForward` and `Photosynthesis` from its enabled actions when the sample files were rebuilt in May 2024, while its genomes were kept. Its creatures ran different brains: about 40–120 survivors per generation instead of the 390 of its history. The two actions are back, and it resumes at about 400.
- Resuming a file or **Update simulation** refilled every cell with the first rain, and creatures loaded from a file started again at age 0. In a continuous run the first resumed generation had a burst: 977 births and 59 deaths instead of about 3400 of each. The file now saves each creature's `age` and the water of each cell (`cellWater`), and a hot change keeps the water of the running world.

## Ideas

- Does a metabolic cost for brain size lead to smaller networks?
- Phylogenetic tree
- Diversity graph: the number of species in each generation
