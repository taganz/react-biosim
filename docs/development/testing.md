# Testing

The tests use [Jest](https://jestjs.io/) with `ts-jest` in a Node environment ([jest.config.js](../../jest.config.js)). The `@/` import alias maps to the repository root, as in `tsconfig.json`.

```bash
npm test                              # all tests
npx jest __tests__/genome.test.ts     # one file
npx jest -t "geneToConnection"        # tests whose name matches
npx tsc --noEmit                      # type check (there is no working lint script)
```

## What is covered

Everything is in [__tests__/](../../__tests__/) and tests the engine. There are no UI tests.

| Area | Files |
|---|---|
| Genome and brain | `genome`, `brain`, `networkInfluence` |
| Creatures | `creature`, `CreatureActions`, `CreatureSensors`, `CreatureSensorsPreyPredator`, `CreatureGenus`, `CreatureMass`, `CreaturePhenotype` |
| Generations | `population`, `selection`, `selectGenusBased` |
| World | `grid`, `GridDetect`, `WorldWater`, `WorldControllerLoop` |
| Save format | `serialization` |
| Other | `EventLogger`, `helpers`, `generateRandomString` |

## Current status

At the time of writing (October 2026), 21 of the 22 suites pass, and 6 tests are skipped. **`EventLogger.test.ts` has 16 failing tests:** the logger records fewer events than the tests expect. The cause has not been investigated.

Fix the logger or its tests before relying on `npm test` as a gate. Until then, check that no *other* suite fails.

## Writing a test

The usual setup is: take a `SimulationData`, make the world small, and create a `WorldController` without starting the loop:

```ts
import { SIMULATION_DATA_DEFAULT } from "@/simulation/simulationDataDefault";
import WorldController from "@/simulation/world/WorldController";

let worldController: WorldController;

beforeEach(() => {
  // copy the parts you change, so the shared defaults stay intact
  const simulationData = {
    ...SIMULATION_DATA_DEFAULT,
    worldObjects: [],
    worldControllerData: { ...SIMULATION_DATA_DEFAULT.worldControllerData, size: 5 },
    worldGenerationsData: { ...SIMULATION_DATA_DEFAULT.worldGenerationsData, initialPopulation: 3 },
  };
  worldController = new WorldController(simulationData);
});

test("a creature is placed on the grid", () => {
  const creature = worldController.generations.newCreature([1, 1], true);
  expect(worldController.grid.cell(1, 1).creature).toBe(creature);
});
```

Tips:

- **Do not mutate the shared defaults.** [_template.test.ts](../../__tests__/_template.test.ts) and several existing tests edit `SIMULATION_DATA_DEFAULT` in place, so changes can leak between tests. Copy the sub-objects you change, as above. `structuredClone` does not work here, because it drops the methods of class instances such as the population strategy.
- `new WorldController()` does not start the loop. Call `worldController.generations.step()` to advance the creatures one step, or `computeStep()` on a single creature.
- To make a creature's behaviour deterministic, give it a genome built with `Genome.connectionToGene({ sourceType, sourceId, sinkType, sinkId, weight })`. `sourceId` and `sinkId` are positions in the **enabled** sensor and action lists.
- Mock `Math.random` (`jest.spyOn(Math, "random")`) to make movement and mutation predictable.
