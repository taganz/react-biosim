# Generations

Source: [WorldController.ts](../../simulation/world/WorldController.ts) runs the loop, and [WorldGenerations.ts](../../simulation/generations/WorldGenerations.ts) holds the creatures and applies selection and repopulation.

## The loop

```
startRun ──▶ populate generation 1
               │
               ▼
        ┌─▶ step: every creature runs computeStep()
        │      │
        │      ├─ no creature alive?  ──▶ wait 1 s, restart from generation 1
        │      │
        │      ├─ step < steps per generation ──▶ next step ──┐
        │      │                                               │
        │      ▼                                               │
        │   end of generation                                  │
        │      1. evaporation                                  │
        │      2. pause between generations (if set)           │
        │      3. generation + 1                               │
        │      generational runs:                              │
        │      4. selection method → survivors + fitness       │
        │      5. clear the grid                               │
        │      6. population strategy → new creatures          │
        │      7. reset the water + first rain (classic runs)  │
        │      8. rain                                         │
        │      continuous runs: nothing happens to creatures   │
        │      9. record stats                                 │
        └──────┘◀──────────────────────────────────────────────┘
```

This page describes **generational** runs, the default. The **Simulation type** setting switches to [continuous runs](#continuous-runs), where the end of a generation does not touch the creatures.

- Generations are numbered from 1, and steps from 1 to *Steps per generation*.
- **Extinction:** if every creature dies during a step, the simulation waits one second and starts again from generation 1, with a new random simulation code. In the classic model creatures do not die, so this only happens with metabolism or attacks.
- **Stats:** after every generation, the [GenerationRegistry](../../simulation/world/stats/GenerationRegistry.ts) records the generation number, the number of survivors, the fitness value, and the births and deaths during the generation. The Stats tab plots the fitness value, and all of it is saved with the simulation.

## Timing and speed

The loop runs in the browser with `setTimeout`, so the page stays responsive:

- One "tick" runs several steps in a row: up to **Immediate steps**, or one step if **Pause between steps** is above 0. A tick never runs longer than 30 ms, and it stops at the end of a generation.
- Between ticks the loop waits **Pause between steps** ms.
- The world is redrawn every **Immediate steps** steps.
- **Total time** and **Last generation duration** leave out the time spent paused.

## Selection

At the end of a generation, `selectionMethod.getSurvivors()` returns the parents of the next generation and a fitness value. The methods are described in the [reference](../reference/population-and-selection.md#selection-methods).

The classic method, **Inside Reproduction Area**, only looks at where creatures **are** at the last step, not at what they did on the way. Creatures that happen to be standing in the area survive. This is why random wandering lets some creatures survive in generation 1, and why the first useful strategies are often "move in one direction".

## Repopulation

`populationStrategy.populate()` empties the world and creates the next generation from the survivors. In the classic strategies:

- every survivor has at least one child;
- extra children are shared out until the population is back to **Initial population**;
- children are placed in random empty cells, or in the spawn area with *Asexual Zone*;
- each child is a mutated copy of its parent's genome (see [Mutation](brain.md#mutation)).

Reproduction is **asexual**: genomes never mix.

Survivors themselves do **not** carry on into the next generation: only their children do. The exception is continuous runs.

## Continuous runs

With **Simulation type** set to **Continuous** (*Scenario → Generations*), the population never ends. A generation is only a time window of *Steps per generation* steps, used for the stats, the logger, the counter and the file names. This mode is experimental.

- **Generation 1** is created by the population strategy, as usual. After that the strategy is not used, and there is no selection method.
- **At the end of a generation** nothing happens to the creatures: they keep their position, mass and age. Creature ids are not reset.
- **Births:** new creatures only come from the **Reproduction** action, which needs [metabolism](creatures.md#mass-and-metabolism) to be on. The Scenario tab shows a warning when metabolism is off or the action is disabled.
- **Deaths:** creatures die of hunger, of attacks, or of old age when they are older than **Maximum age**.
- **Water** is never reset. The rain of a generation is spread over its steps: each step rains `1 ÷ steps per generation` of **Rain max per cell** (see [World → Water](world.md#water)).
- **The Age sensor** is the age of the creature divided by **Maximum age**, instead of the time since the start of the generation.
- **Stats:** the plotted value is the population at the end of each window. The fitness chart in the Simulation tab also shows the births and deaths of the last window.
- If every creature dies, the simulation restarts from generation 1, as in generational runs.

Files saved with the old *Continuous* population strategy or selection method load as continuous runs, with Random Fixed Genera as the strategy for generation 1.

## Why it works

Each generation, the survivors pass on their genomes, and mutations make small random changes. Most changes are neutral or harmful, but the few that make a creature more likely to survive spread, because those creatures leave more children. Over many generations, the genomes in the population come to encode behaviour that meets the selection criterion. Nobody designs that behaviour: it is the result of variation plus selection.
