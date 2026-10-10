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
        │      4. selection method → survivors + fitness       │
        │      5. clear the grid                               │
        │      6. population strategy → new creatures          │
        │      7. reset the water + first rain (classic runs)  │
        │      8. rain                                         │
        │      9. record stats                                 │
        └──────┘◀──────────────────────────────────────────────┘
```

- Generations are numbered from 1, and steps from 1 to *Steps per generation*.
- **Extinction:** if every creature dies during a step, the simulation waits one second and starts again from generation 1, with a new random simulation code. In the classic model creatures do not die, so this only happens with metabolism or attacks.
- **Stats:** after every generation, the [GenerationRegistry](../../simulation/world/stats/GenerationRegistry.ts) records the generation number, the number of survivors and the fitness value. The Stats tab plots this, and it is saved with the simulation.

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

Survivors themselves do **not** carry on into the next generation: only their children do. The exception is the continuous strategy.

## Continuous runs

With the **Continuous** strategy and selection method, a generation is just a time slice. Creatures stay alive and keep their position. They reproduce during the generation with the **Reproduction** action, and they die of hunger, attacks or old age. The water is not reset between generations. This mode is experimental (see the [known issues](../reference/population-and-selection.md#known-issues)).

## Why it works

Each generation, the survivors pass on their genomes, and mutations make small random changes. Most changes are neutral or harmful, but the few that make a creature more likely to survive spread, because those creatures leave more children. Over many generations, the genomes in the population come to encode behaviour that meets the selection criterion. Nobody designs that behaviour: it is the result of variation plus selection.
