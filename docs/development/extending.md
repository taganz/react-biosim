# Extending the simulation

## Add a sensor

Sensors live in [CreatureSensors.ts](../../simulation/creature/brain/CreatureSensors.ts). Three parts must agree:

1. **Name.** Add it to the `SensorName` union type.
2. **Definition.** Add an entry to the `data` table:
   ```ts
   MySensor: {
     name: "MySensor",
     enabled: false,
     neuronCount: 1,                        // always 1
     compatibleGenus: ["plant", "attack_plant", "attack_animal"],
     mainGenus: null,                       // always null for sensors
   },
   ```
3. **Value.** In `calculateOutputs()`, push the value **at the same position** as the entry in `data`:
   ```ts
   if (this.data.MySensor.enabled) {
     values.push(/* a number, ideally in [0, 1] */);
   }
   ```

`calculateOutputs()` must push exactly one value per enabled sensor, **in the order of the `data` table**. The network reads inputs by position, so a missing or misplaced `push` shifts every later sensor. This is the bug behind `PredatorDistance` and `PredatorDirection` (see [known issues](../reference/sensors-and-actions.md#known-issues)).

Add the sensor **at the end** of `data`. Inserting it in the middle changes the position of the sensors after it. Saved genomes then point to different sensors, but only in simulations where the new sensor is enabled.

The Settings checkboxes and the network diagram labels are generated from `data`, so they need no change. Add the sensor to `enabledSensors` in a scenario or in [simulationDataDefault.ts](../../simulation/simulationDataDefault.ts) to switch it on by default. Then document it in [sensors-and-actions.md](../reference/sensors-and-actions.md).

**Test it** the way [CreatureSensors.test.ts](../../__tests__/CreatureSensors.test.ts) does: build a small world, place a creature and check `calculateOutputs()`.

## Add an action

Actions live in [CreatureActions.ts](../../simulation/creature/brain/CreatureActions.ts), and follow the same pattern:

1. Add the name to `ActionName`.
2. Add an entry to `data` (at the end). `mainGenus` is the genus that the action gives to a creature (see [genus](../model/creatures.md#genus)). Leave it `null` unless the action defines a trophic level.
3. In `executeActions()`, handle it **in the same order** and always advance the index, whether or not the action fired:
   ```ts
   if (this.data.MyAction.enabled) {
     if (input > 0) {
       creature.doSomething(input);
     }
     currentIndex++;
     input = values[currentIndex];
   }
   ```

If the action has a cost, use `creature._mass.consume(...)` so the water stays balanced (see [World → Water](../model/world.md#water)).

## Add a population strategy or a selection method

1. Create a class that implements [PopulationStrategy](../../simulation/generations/population/PopulationStrategy.ts) (`name`, `populate(generations, parents?)`) or [SelectionMethod](../../simulation/generations/selection/SelectionMethod.ts) (`name`, `prettyName`, `isContinuous`, `fitnessValueName`, `shouldResetLastCreatureIdCreatedEveryGeneration`, `getSurvivors(generations)`).
2. Register it in [populationStrategyOptions.ts](../../simulation/generations/population/populationStrategyOptions.ts) or [selectionMethodOptions.ts](../../simulation/generations/selection/selectionMethodOptions.ts): an entry in the options list (the Settings dropdown) and one in the map (used when loading files). The map key must equal the class's `name`.

Useful helpers:

- `generations.newCreature(position, firstGeneration, genome?)`: creates a creature and puts it on the grid. With `firstGeneration = false` and a genome, the genome is mutated.
- `generations.grid.getRandomAvailablePosition()`, `getCenteredAvailablePosition(...)` and `getNearByAvailablePosition(...)`: find free cells. They can return `null` when the world is full.
- `addCreaturesFromGenus()` and `addCreaturesFromParent()` in [addCreatures.ts](../../simulation/generations/population/addCreatures.ts).

`getSurvivors()` returns `{ survivors, fitnessMaxValue }`. The fitness value is what the Stats chart plots, and `fitnessValueName` is the chart title. Set `isContinuous: true` only if creatures should keep their water between generations.

## Add a map object

1. Create the class in [simulation/world/objects/](../../simulation/world/objects/) or [simulation/world/areas/](../../simulation/world/areas/). Implement [WorldObject](../../simulation/world/objects/WorldObject.ts), or extend an existing shape. An object with no `areaType` is **solid**. Areas use 0 (reproduction), 1 (health) and 2 (spawn). Use `areaEffectOnCreature(creature)` for an effect on the creatures standing in it, but note that `WorldGenerations.step()` does not call it at present.
2. Add a formatter to `objectFormatters` in [objectsSerialization.ts](../../simulation/serialization/formatters/objectsSerialization.ts), keyed by the class `name`, so maps can be saved.
3. Add a preset to `addPresets` in [MapDesignerFooter.tsx](../../components/simulation/tabs/map/MapDesignerFooter.tsx), so the map editor can create it.

## Add a scenario

1. Set the scenario up in the app, then save it with **Files → Save to file**.
2. Put the file in [public/](../../public/).
3. Add an entry to [scenarioObjects.tsx](../../components/simulation/tabs/start/scenarioObjects.tsx):
   ```ts
   scenarioObjects.push({ name: "My scenario", filename: "my scenario.sim", action: "startRun" });
   ```
   Use `startRun` to start from generation 1 with the file's settings, or `resumeRun` to show an evolved population.
4. Describe it in [scenarios.md](../user/scenarios.md).

## Change the startup scenario

The app opens with `startUpScenarioSimulationData` from [startupScenario.ts](../../simulation/startupScenario.ts). To open with `SIMULATION_DATA_DEFAULT` instead, set `STARTUP_MODE = "simulationDefault"` in [simulationDataDefault.ts](../../simulation/simulationDataDefault.ts).
