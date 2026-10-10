# Save format

**Save to file** in the Files tab writes one JSON document, which [serializeSimulationData](../../simulation/serialization/formatters/simulationDataSerialization.ts) builds from the running controller. Its type is [SavedSimulationData](../../simulation/serialization/data/SavedSimulationData.ts). The `.sim` extension is only a convention.

## Structure

```jsonc
{
  "constants": { ... },              // SimulationData.constants, as is
  "worldGenerationsData": {          // SavedWorldGenerationData
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
                       "lastMovement": [dx, dy], "mass": 1, "massAtBirth": 1 } ] }
  ],
  "stats": {                         // SavedGenerationRegistry
    "generations": [ { "g": 1, "sC": 120, "sP": 500, "fV": 24 } ],  // generation, survivors, population, fitness
    "minSurvivorCount": 0, "maxSurvivorCount": 0, "maxFitnessValue": 0
  }
}
```

Notes:

- **Strategies and methods** are saved by their `name`, and loading looks the name up in `populationMap` / `selectionMap`. An unknown name falls back to *Asexual Random* or *Inside Reproduction Area*, with a console warning.
- **Map objects** are saved by class name. Each type needs an entry in `objectFormatters` in [objectsSerialization.ts](../../simulation/serialization/formatters/objectsSerialization.ts): `RectangleObject`, `EllipseObject`, the reproduction and health areas in both shapes, and `RectangleSpawnArea`.
- **Creatures** are grouped by species, because creatures of a species share a genome. Only position, movement and mass are saved for each creature. Ids, age, health and `distanceCovered` are not saved: they restart when the file is loaded.
- `constants` is copied as is, so a file keeps its own `LOG_*`, `DETECT_RADIUS` and other constants.
- Indentation is controlled by `PRETTIFY_OUTPUT_TO_FILE` and `PRETTIFY_OUTPUT_TO_COPY`.

## Loading

[loadWorld.ts](../../simulation/world/loadWorld.ts) offers two entry points. Both parse and deserialize first, and only then touch the controller:

| Function | Used by | Effect |
|---|---|---|
| `loadSavedWorldAndResumeRun` | Files → Load, scenarios marked `resumeRun` | `resumeRun()`: same generation, same creatures, same stats |
| `loadSavedSimulationAndStartRun` | Scenarios marked `startRun` | `startRun()`: same settings and map, from generation 1, new simulation code |

`deserializeSimulationData` **requires** `species` and `stats`, and throws if either is missing. To hand-write a scenario that starts from scratch, include `"species": []` and `"stats": {}`.

When a run resumes, every saved creature is rebuilt for the new world (see [Architecture](architecture.md#ui--engine-applying-settings)). A creature whose cell is outside the world, an obstacle or already taken is dropped.

## Compatibility

The format has **no version number**. Fields are read by name, so:

- **Adding** a field to `SimulationData` breaks old files unless the deserializer gives it a default. Old files leave the field `undefined`.
- **Renaming** a sensor, action, strategy, method or object class breaks every file that uses the old name.
- **Reordering** sensors or actions does not change what saved genes mean, because a gene points to a position in the *enabled* list (see [gene encoding](../reference/sensors-and-actions.md#gene-encoding)). The enabled list follows the order of the `data` table in `CreatureSensors` and `CreatureActions`. So reordering that table *does* change what every saved genome means.

Before changing any of these, load the files in `public/` to check that they still work. They are the scenarios users see first.
