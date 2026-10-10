# Architecture

## Two layers

```
┌──────────────────────────── React UI (components/) ────────────────────────────┐
│  Tabs, footer, canvas component                                                 │
│      │ read: useWorldValue(getter)        │ write: call methods / set fields    │
│      │       (subscribes to events)       │        on worldController           │
│      ▼                                    ▼                                     │
│  ┌───────────── Jotai store (components/simulation/store) ──────────────────┐   │
│  │ worldControllerAtom   simulationDataAtom (Settings draft)   selected*Atom │   │
│  └──────────────────────────────┬───────────────────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────────────────────┘
                                  │ the same WorldController instance
┌───────────────────── Engine (simulation/) ┴─────────────────────────────────────┐
│  WorldController ── loop, timing, events (EventTarget)                          │
│    ├─ Grid ── cells, objects, creatures                                         │
│    ├─ WorldGenerations ── creatures, sensors/actions config,                    │
│    │     populationStrategy, selectionMethod                                    │
│    ├─ WorldWater, GenerationRegistry (stats), EventLogger                       │
│    └─ simData: SimulationData (the settings it is running with)                 │
│  WorldCanvas ── draws grid and creatures on the <canvas>                        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

The engine is a plain, mutable object graph. React does not own its state. React holds a **reference** to the single `WorldController` and asks it for values when it re-renders.

## Startup

[SimulationCanvas.tsx](../../components/simulation/SimulationCanvas.tsx) creates everything once, when it mounts:

1. It picks the startup `SimulationData`: `startUpScenarioSimulationData`, or `SIMULATION_DATA_DEFAULT` if `STARTUP_MODE` in [simulationDataDefault.ts](../../simulation/simulationDataDefault.ts) is `"simulationDefault"`.
2. It runs `new WorldController(simData)` and then `startRun(simData)`, which starts the loop.
3. It stores the controller in `worldControllerAtom` and the settings in `simulationDataAtom`.
4. It creates a `WorldCanvas` for the `<canvas>` element and stores it in `worldCanvasAtom`.
5. It listens to the `redraw` and `startGeneration` events to repaint, and to canvas clicks to select creatures.

Loading a scenario or a file does **not** create a new controller. It calls `startRun()` or `resumeRun()` on the existing one, which rebuilds the grid, the generations and the water inside it.

## The store

[components/simulation/store/](../../components/simulation/store/):

| Atom | Holds |
|---|---|
| `worldControllerAtom` | The single `WorldController` (or `null` before mount). |
| `worldCanvasAtom` | The `WorldCanvas`. |
| `simulationDataAtom` | The **draft** `SimulationData` edited in the Settings tab. It is not the running configuration: that lives in `worldController.simData`. |
| `selectedCreatureAtom`, `selectedSpeciesAtom` | The selection made on the canvas or in the Population tab. |
| `eventLoggerAtom` | The controller's `EventLogger`. |
| `pauseBetweenStepsAtom`, `pauseBetweenGenerationsAtom`, `immediateStepsAtom` | Footer speed controls. An effect in `FooterSpeedControls` copies them onto the controller. |
| `mapDesigner*Atom` | Map editor state (objects, selection, fullscreen). |
| `gif.ts` atoms | GIF recorder state. |

## Engine → UI: events

`WorldController.events` is a DOM `EventTarget`. It dispatches these [WorldEvents](../../simulation/events/WorldEvents.ts):

| Event | When |
|---|---|
| `initializeWorld` | After `startRun()` or `resumeRun()` rebuilds the world |
| `startGeneration` | At step 1 of every generation |
| `startStep`, `endStep` | Around every step. `endStep` can fire thousands of times per second. |
| `redraw` | Every *Immediate steps* steps |
| `stateChange` | Pause, resume, logger changes: anything outside the loop |

**Reading engine values in a component:** use [useWorldValue](../../hooks/useWorldValue.ts):

```tsx
const currentGen = useWorldValue((world) => world.currentGen, 0);
```

It is built on `useSyncExternalStore`. It subscribes to `initializeWorld`, `startGeneration`, `endStep` and `stateChange`, and coalesces them into at most **one re-render per animation frame**. Two rules:

- The getter must return a primitive or a stable reference: React compares snapshots with `Object.is`. Do not build a new array or object in the getter.
- The default value must also be stable. Define it outside the component, as `NO_GENERATIONS` in `StatsPanel` does.

Heavy views, such as the species list, listen to `startGeneration` directly and compute their data once per generation.

## UI → engine: applying settings

```
Settings tab ──edits──▶ simulationDataAtom (draft)
                          │
      "Update simulation" │  worldControllerSimDataHotChange(controller, draft)
                          │    copies the run state (generation, step, counters,
                          │    speed) into the draft, then controller.resumeRun(draft)
                          │    → rebuilds grid and generations from draft.species
                          │
      "Restart"           │  controller.startRun(draft) → generation 1
                          ▼
              worldController.simData === draft
```

The Settings tab shows "pending changes" when `simulationDataAtom` is a different object from `worldController.simData`. Every edit creates a new object (`{...prev, …}`), so this reference comparison is enough.

The map editor's **Use Map** does the same as Update simulation: it writes the objects into the draft and calls `worldControllerSimDataHotChange`.

> **Known issue.** `resumeRun` rebuilds the population from `sim.species`. The running creatures are never copied into the draft, so the hot change loses them:
> - **Draft without `species`** (the startup scenario): `WorldGenerations` is created with an empty creature list. The next step finds no living creature, and the loop restarts from generation 1 as an extinction.
> - **Draft loaded from a file:** `species` still holds the `Creature` objects from load time, and those are put back instead of the current ones.
>
> Two more problems in the same path:
> - `Grid.isTileEmpty` does not check bounds, so restoring a creature outside a smaller world would index outside the grid.
> - `worldControllerSimDataHotChange` mutates the draft object in place.
>
> A fix should serialise the current creatures (as `serializeSpecies` does) into the data passed to `resumeRun`, and skip creatures that fall outside the new grid.

Loading a file ([useSimulationLoader](../../hooks/useSimulationLoader.ts)) parses and validates the file **before** touching the running simulation. A bad file therefore leaves the current run untouched. It then calls `resumeRun` or `startRun` and replaces the draft with the loaded data.

## The loop

`WorldController.mainLoop()` runs one "tick" of up to *Immediate steps* steps (or 30 ms), then schedules the next tick with `setTimeout(pauseBetweenSteps)`. A run id guards against stale ticks: `startRun`, `resumeRun` and extinction restarts increase it, and any tick from an older run stops. See [Generations](../model/generations.md) for what happens in a step and at the end of a generation.

## Drawing

[WorldCanvas.ts](../../simulation/world/WorldCanvas.ts) redraws the whole world on each `redraw` event: background, objects, then one square per creature in its phenotype colour. The selection ring is drawn on a separate overlay canvas, so it can be updated while the simulation is paused without repainting the world.

## Logging

[EventLogger](../../simulation/logger/EventLogger.ts) collects creature and generation events (see [LogEvent.ts](../../simulation/logger/LogEvent.ts)) and saves them as CSV. It is configured through the `LOG_*` constants. Its UI is in *Stats → Under development*.
