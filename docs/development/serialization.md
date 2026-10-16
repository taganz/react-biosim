# Save format

**Save to file** in the Files tab writes one JSON document, which [serializeSimulationData](../../simulation/serialization/formatters/simulationDataSerialization.ts) builds from the running controller. Its type is [SavedSimulationData](../../simulation/serialization/data/SavedSimulationData.ts). The `.sim` extension is only a convention.

## Structure

```jsonc
{
  "constants": { ... },              // SimulationData.constants, as is
  "worldGenerationsData": {          // SavedWorldGenerationData
    "simulationType": "generational", "maxAge": 1000,     // missing in older files
    "populationStrategy": "AsexualZonePopulation",        // class name
    "selectionMethod": "InsideReproductionAreaSelection", // class name
    "initialPopulation": 500,
    "initialGenomeSize": 4, "maxGenomeSize": 30, "maxNumberNeurons": 15,
    "mutationMode": "wholeGene", "mutationProbability": 0.05,
    "deletionRatio": 0.5, "geneInsertionDeletionProbability": 0.015,
    "enabledSensors": ["HorizontalPosition", ...],
    "enabledActions": ["MoveNorth", ...],
    "metabolismEnabled": false, "phenotypeColorMode": "genome",
    "plantGenes": "[-2071543808,-2071486464]",   // a JSON string, not an array
    "lastCreatureIdCreated": 500, ...              // run state
  },
  "worldControllerData": { ... },    // WorldControllerData, as is (size, steps, metabolism constants, speed, run state)
  "waterData": { ... },              // WaterData, as is
  "worldObjects": [                  // SavedWorldObject[]
    { "type": "RectangleReproductionArea",
      "data": { "x": 0.25, "y": 0.25, "width": 0.5, "height": 0.5, "relative": true } }
  ],
  "species": [                       // SavedSpecies[], largest first
    { "genes": [ -1234567, ... ],
      "creatures": [ { "position": [x, y], "lastPosition": [x, y],
                       "lastMovement": [dx, dy], "mass": 1, "massAtBirth": 1, "age": 120 } ] }
  ],
  "cellWater": [ 50, 49.873, ... ],  // water of each cell, row by row (y, then x), 3 decimals
  "stats": {                         // SavedGenerationRegistry
    "generations": [ { "g": 1, "sC": 120, "sP": 500, "fV": 24, "b": 0, "d": 0 } ],  // generation, survivors, population, fitness, births, deaths
    "minSurvivorCount": 0, "maxSurvivorCount": 0, "maxFitnessValue": 0
  },
  "startGenomes": [                  // SavedStartGenome[], only in a "generation start" (see below)
    { "genes": [ -1234567, ... ], "count": 12 }
  ]
}
```

Notes:

- **Strategies and methods** are saved by their `name`, and loading looks the name up in `populationMap` / `selectionMap`. An unknown name falls back to *Asexual Random* or *Inside Reproduction Area*, with a console warning.
- **Older files** have no `simulationType` or `maxAge`. They load as generational runs with a maximum age of 1000. A file with the removed `ContinuousPopulation` or `ContinuousSelection` loads as a continuous run, with *Random Fixed Gene* and *Inside Reproduction Area* in their place ([worldGenerationDataSerialization.ts](../../simulation/serialization/formatters/worldGenerationDataSerialization.ts)).
- **Map objects** are saved by class name. Each type needs an entry in `objectFormatters` in [objectsSerialization.ts](../../simulation/serialization/formatters/objectsSerialization.ts): `RectangleObject`, `EllipseObject`, the reproduction and health areas in both shapes, and `RectangleSpawnArea`.
- **Creatures** are grouped by species, because creatures of a species share a genome. Only position, movement, mass and age are saved for each creature. Ids, health and `distanceCovered` are not saved: they restart when the file is loaded. Files saved before October 2026 have no `age`, so their creatures start again at age 0: in a continuous run none of them dies of old age until `maxAge` steps have passed.
- **`cellWater`** is saved with the creatures, so a resumed run continues with the water the cells had. Files without it (older files, setups, generation starts) give the cells the first rain. Resuming checks that it fits the world (same number of cells, and no more water than the total): otherwise it also falls back to the first rain.
- `stats` is left out when **Include the stats history** is unchecked (`serializeSimulationData(worldController, false)`).
- The run state in `worldControllerData` (`simCode`, `currentGen`, `currentStep`, times and speed) is read from the controller when saving, so a file records where the run is now.
- `constants` is copied as is, so a file keeps its own `LOG_*`, `DETECT_RADIUS` and other constants.
- Indentation is controlled by `PRETTIFY_OUTPUT_TO_FILE` and `PRETTIFY_OUTPUT_TO_COPY`.

## Loading

[loadWorld.ts](../../simulation/world/loadWorld.ts) offers two entry points. Both parse and deserialize first, and only then touch the controller:

| Function | Used by | Effect |
|---|---|---|
| `loadSavedWorldAndResumeRun` | Files → Load, scenarios marked `resumeRun` | `resumeRun()`: same generation, same creatures, same stats |
| `loadSavedSimulationAndStartRun` | Scenarios marked `startRun` | `startRun()`: same settings and map, from generation 1, new simulation code |

`loadSavedWorldAndResumeRun` checks for `startGenomes` first: a file that has them calls `startGeneration()` instead of `resumeRun()` (see below).

`species`, `stats` and `startGenomes` are optional. A hand-written scenario that starts from scratch can leave them out. A file without `stats` starts an empty history; it does not keep the history of the run that was running before.

When a run resumes, every saved creature is rebuilt for the new world (see [Architecture](architecture.md#ui--engine-applying-settings)). A creature whose cell is outside the world, an obstacle or already taken is dropped.

## User scenarios

**My scenarios** in the Files tab writes the same format, through two other serializers in [simulationDataSerialization.ts](../../simulation/serialization/formatters/simulationDataSerialization.ts):

| Serializer | Content | Loaded with |
|---|---|---|
| `serializeSetup` | Settings and map; no `species`, `stats` or `startGenomes`; run state at generation 1 | `loadSavedSimulationAndStartRun` → `startRun()` |
| `serializeGenerationStart` | Settings, map, `startGenomes`, and `stats` if asked; `currentStep` is 1 | `loadSavedWorldAndResumeRun` → `startGeneration()` |

`startGenomes` are the genomes of the creatures that started the current generation. `WorldGenerations.startGenomes` records them each time a generation is populated (`populate`, `selectionAndRepopulate`, `populateWithGenomes`), and `resumeRun` keeps or rebuilds them. Creatures that share a genome are saved once with a `count`.

`WorldController.startGeneration(sim)` builds the world like `startRun`, keeps `simCode` and `currentGen` from the file, copies `stats` if present, and calls `WorldGenerations.populateWithGenomes()`. That places one creature per genome, without mutation, around the spawn area if there is one and at random otherwise, the same way the first generation of *Asexual Zone* does. The population strategy is not called, so a strategy with its own placement rules (plants and herbivores, for example) is not followed for that one generation.

The JSON is stored in the browser's IndexedDB by [helpers/userScenarios.ts](../../helpers/userScenarios.ts): database `biosim`, store `userScenarios` for the list (name, kind, generation, date, size) and `userScenarioData` for the JSON, both keyed by the scenario id.

## Compatibility

The format has **no version number**. Fields are read by name, so:

- **Adding** a field to `SimulationData` breaks old files unless the deserializer gives it a default. Old files leave the field `undefined`.
- **Renaming** a sensor, action, strategy, method or object class breaks every file that uses the old name.
- **Reordering** sensors or actions does not change what saved genes mean, because a gene points to a position in the *enabled* list (see [gene encoding](../reference/sensors-and-actions.md#gene-encoding)). The enabled list follows the order of the `data` table in `CreatureSensors` and `CreatureActions`. So reordering that table *does* change what every saved genome means.

Before changing any of these, load the files in `public/` to check that they still work. They are the scenarios users see first.
