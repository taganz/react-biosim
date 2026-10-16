# Developer guide

For people who want to change the code. Read the [simulation model](../model/README.md) first: it explains what the engine does, and these pages explain how the code is organised.

1. [Architecture](architecture.md): engine and UI, the Jotai store, events, and how settings reach the simulation
2. [Save format](serialization.md): what a `.sim` file contains and how loading works
3. [Extending](extending.md): add a sensor, an action, a population strategy, a selection method, a map object or a scenario
4. [Testing](testing.md): running the tests, current status, writing new ones

## Setup

Requirements: Node.js 20.9 or later (Next.js 16 requires it).

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Jest
npx tsc --noEmit   # type check
npm run lint       # ESLint
npm run build      # production build
npm run sim        # headless runner, see docs/user/headless-runner.md
```

`npm run lint` runs the ESLint CLI with `eslint.config.mjs` (Next.js 16 removed `next lint`) and should report nothing. It includes the React Compiler rules: don't mutate state, props or atom values (change a clone), don't read or write refs during render, and don't call `setState` synchronously in an effect. ESLint does not type-check, so also run `npx tsc --noEmit`.

### Environment variables (optional)

`app/layout.tsx` loads Microsoft Clarity and Google Analytics with IDs read from a `.env` file:

| Variable | Use |
|---|---|
| `REACT_APP_CLARITY_ID` | Microsoft Clarity project id |
| `REACT_APP_GOOGLE_GA_ID` | Google Analytics id |

Without them the tags load with empty ids and do nothing. You do not need them for development.

## Project layout

```
app/                     Next.js App Router: page.tsx (tabs) and layout.tsx
components/
  global/                Reusable UI: Button, inputs, tabs, toggles, LinearGraph
  providers/             JotaiProvider
  simulation/            Everything tied to the simulation
    SimulationCanvas.tsx   Creates the WorldController and draws the world
    controlbar/            Top bar: generation counter, survivors, speed controls, Restart, Play / Pause
    store/                 Jotai atoms
    tabs/                  One folder per tab: start, population, stats, settings, map, save, load, files
hooks/                   useWorldValue, useSimulationLoader, mouse and scroll helpers
helpers/                 Coordinates, map-object geometry, random strings, user scenario storage
simulation/              The engine: plain TypeScript, no React
  world/                   WorldController (loop), Grid, WorldCanvas, objects and areas, stats
  generations/             WorldGenerations, population strategies, selection methods
  creature/                Creature, mass, attack, reproduction, genus, phenotype
    brain/                 Genome, CreatureBrain, Network, sensors, actions
  water/                   WorldWater, rain types
  serialization/           Saved* types and the formatters that read and write them
  logger/                  EventLogger (CSV log)
  headless/                runHeadless: runs a simulation in Node without drawing
  helpers/                 random.ts (the seeded random generator), helpers.ts
  simulationDataDefault.ts Default SimulationData and constants
  startupScenario.ts       SimulationData loaded when the app opens
public/                  Scenario .sim files served to the Start tab
scripts/                 sim.ts: command line of the headless runner (npm run sim, with tsx)
__tests__/               Jest tests for the engine
```

The **engine** (`simulation/`) has no React imports and can run in Node, which is how the tests use it. The only exception is `WorldController`, which uses `window.setTimeout` for its loop. Most tests that create one never start the loop; the [headless runner](../user/headless-runner.md) runs it in Node by setting `window` to `globalThis`.

`app/api/hello/route.ts` is left over from the Next.js template and is not used.

## Keeping the docs up to date

The reference pages are lists taken from the code. Update them in the same change as the code:

| If you change… | Update |
|---|---|
| A field in `SimulationData`, a Settings input, or a startup value | [parameters.md](../reference/parameters.md) |
| A sensor, an action or the gene encoding | [sensors-and-actions.md](../reference/sensors-and-actions.md) |
| A population strategy or a selection method | [population-and-selection.md](../reference/population-and-selection.md) |
| A tab or a button | the matching page in [docs/user/](../user/), and its screenshot if the layout changed |
| The scenarios in `public/` | [scenarios.md](../user/scenarios.md) |
| The save format | [serialization.md](serialization.md) |
| A logged event, or the logger's columns and levels | [log-file.md](../reference/log-file.md) |
| The headless runner's options or output files | [headless-runner.md](../user/headless-runner.md) |
