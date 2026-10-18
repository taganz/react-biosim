# Testing

The tests use [Jest](https://jestjs.io/) with `ts-jest` in a Node environment ([jest.config.js](../../jest.config.js)). The `@/` import alias maps to the repository root, as in `tsconfig.json`.

```bash
npm test                              # all tests
npx jest __tests__/genome.test.ts     # one file
npx jest -t "geneToConnection"        # tests whose name matches
npx tsc --noEmit                      # type check
npm run lint                          # ESLint
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
| Headless runner and seed | `runHeadless`, `Seed` |
| Other | `EventLogger`, `helpers`, `generateRandomString` |

## Current status

At the time of writing (October 2026), all 32 suites pass, and 6 tests are skipped. `npm test` must pass before a change is committed.

## Writing a test

Tests start from `TEST_SIMULATION_DATA` in [__tests__/support/testSimulationData.ts](../../__tests__/support/testSimulationData.ts): the startup settings with the changes the tests rely on (a 50×50 world, metabolism off and free, big brains, every sensor and action enabled, Plant/Herbivore and Greatest Mass). It lists those changes explicitly, so any other default comes from [startupScenario.ts](../../simulation/startupScenario.ts). Jest ignores `__tests__/support/`, which holds helpers, not tests.

The usual setup is: take `TEST_SIMULATION_DATA`, make the world small, and create a `WorldController` without starting the loop:

```ts
import { TEST_SIMULATION_DATA } from "./support/testSimulationData";
import WorldController from "@/simulation/world/WorldController";

let worldController: WorldController;

beforeEach(() => {
  // copy the parts you change, so the shared defaults stay intact
  const simulationData = {
    ...TEST_SIMULATION_DATA,
    worldObjects: [],
    worldControllerData: { ...TEST_SIMULATION_DATA.worldControllerData, size: 5 },
    worldGenerationsData: { ...TEST_SIMULATION_DATA.worldGenerationsData, initialPopulation: 3 },
  };
  worldController = new WorldController(simulationData);
});

test("a creature is placed on the grid", () => {
  const creature = worldController.generations.newCreature([1, 1], true);
  expect(worldController.grid.cell(1, 1).creature).toBe(creature);
});
```

Tips:

- A test that needs another value changes it in its copy. Change `TEST_SIMULATION_DATA` only for a value that many tests need; a changed startup default reaches the tests unless it is listed there.
- **Do not mutate the shared settings.** [_template.test.ts](../../__tests__/_template.test.ts) and several existing tests edit `TEST_SIMULATION_DATA` in place, so changes can leak between tests. Copy the sub-objects you change, as above. `structuredClone` does not work here, because it drops the methods of class instances such as the population strategy.
- `new WorldController()` does not start the loop. Call `worldController.generations.step()` to advance the creatures one step, or `computeStep()` on a single creature.
- To make a creature's behaviour deterministic, give it a genome built with `Genome.connectionToGene({ sourceType, sourceId, sinkType, sinkId, weight })`. `sourceId` and `sinkId` are positions in the **enabled** sensor and action lists.
- Mock `Math.random` (`jest.spyOn(Math, "random")`) to make movement and mutation predictable.
