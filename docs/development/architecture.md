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

`resumeRun(sim, creatures?)` takes its creatures from the `creatures` argument when one is given, and from `sim.species` otherwise. The hot change passes `worldController.generations.currentCreatures`, the creatures alive right now. Loading a file passes nothing, so the saved species are used.

In both cases each creature is **rebuilt** with `WorldGenerations.restoreCreature()`. The rebuilt creature belongs to the new `WorldGenerations`, so it uses the new grid and the new sensor and action configuration. It keeps the genome, position, mass and counters of the original. Creatures that fall outside the new world, or on a cell that is now solid or taken, are dropped.

Do not put the old `Creature` objects back on the new grid. They still point to the old `WorldGenerations`: they would move on the old grid and read the old settings.

`worldControllerSimDataHotChange` writes the run state into the draft object in place. After the update, the draft *is* `worldController.simData`.

Loading a file ([useSimulationLoader](../../hooks/useSimulationLoader.ts)) parses and validates the file **before** touching the running simulation. A bad file therefore leaves the current run untouched. It then calls `resumeRun` or `startRun` and replaces the draft with the loaded data.

## The loop

`WorldController.mainLoop()` runs one "tick" of up to *Immediate steps* steps (or 30 ms), then schedules the next tick with `setTimeout(pauseBetweenSteps)`. A run id guards against stale ticks: `startRun`, `resumeRun` and extinction restarts increase it, and any tick from an older run stops. See [Generations](../model/generations.md) for what happens in a step and at the end of a generation.

## Drawing

[WorldCanvas.ts](../../simulation/world/WorldCanvas.ts) redraws the whole world on each `redraw` event: background, objects, then one square per creature in its phenotype colour. The selection ring is drawn on a separate overlay canvas, so it can be updated while the simulation is paused without repainting the world.

## Logging

[EventLogger](../../simulation/logger/EventLogger.ts) collects creature and generation events (see [LogEvent.ts](../../simulation/logger/LogEvent.ts)) and saves them as CSV. It is configured through the `LOG_*` constants. Its UI is in *Stats → Under development*.
