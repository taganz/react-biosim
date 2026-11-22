# Turning under Greatest Distance (November 2026)

Question: why creatures selected by Greatest Distance never turn, and what lets them.

## Why they do not turn (startup scenario, 4 genes, 1 neuron)

Survivors cross the world once, slowly: about 90 moves in 300 steps and no turns. Hand-made strategies in a 100-cell world, 300 steps:

| Strategy | Distance index |
|---|---|
| Slow, 1 move every 3 steps, no turn | 63 |
| Fast, no turn | 0 (more than 100 steps stopped at the wall) |
| Fast, turns at the walls | 189 |
| Fast, turns with the Oscillator (every 31 steps) | 0 (a run scores only after 35 steps) |

Turning would triple the score, but going fast without turning scores 0: there is a fitness valley.
Sensors are 0 to 1 and actions only act on a positive output, so a single gene cannot reverse a direction.

## Runs

Configs `turning-baseline.json`, `turning-genome.json` (genome 8 to 12 genes, 2 neurons) and `turning-touch.json`
(the same plus TouchNorth/East/South/West). 200 generations, seeds 1 to 3. Max index > 63 is only possible by turning.

| Condition | s1 | s2 | s3 |
|---|---|---|---|
| baseline | 63 | 60 | 63 |
| genome | 102 (about 90 at the end) | 94 (about 92) | 61 |
| touch | 63 | 107 (once, then about 60) | 71 (once) |

- **The bigger genome is what allows turning**, in 2 of 3 seeds, from about generation 50 to 75.
- The turn found in `genome-s2` is a **timer**, not a reaction to the wall: Age drives a self-latching neuron that, at a
  given time, flips neuron 0 from MoveNorth to MoveSouth. One U-turn per generation, about 160 moves, index about 87.
- **Touch sensors did not help** in these seeds. More sensors make random genes less likely to hit the useful ones, and
  the valley (fast without turning scores 0) is still there. Three seeds are few.

## MoveForward fix and no stopped penalty

`turning-variants.ts` patches Creature at run time, the engine is unchanged:
- **fix**: a failed move sets `lastMovement` to 0, so MoveForward stops pushing into a wall or a neighbour (part of the engine since November 2026, so the flag no longer changes anything);
- **no penalty**: standing still does not take points away.

200 generations, seeds 1 to 3. Turning seeds: survivors with reversals in the last 50 generations.
Survivor index is the mean of the survivors over the last 50 generations.

| Genome | Fix | No penalty | Turning seeds | Survivor index of those seeds |
|---|---|---|---|---|
| 4 genes | | | 0 / 3 | |
| 4 genes | | ✓ | 0 / 3 | |
| 4 genes | ✓ | | 1 / 3 | 105 |
| 4 genes | ✓ | ✓ | 1 / 3 | 78 |
| 8 to 12 genes, 2 neurons | | | 1 / 3 | 87 |
| 8 to 12 genes, 2 neurons | | ✓ | 0 / 3 | |
| 8 to 12 genes, 2 neurons | ✓ | | 2 / 3 | 67, 89 |
| 8 to 12 genes, 2 neurons | ✓ | ✓ | **3 / 3** | 97, 104, 101 |

Runs where nobody turns stay at a survivor index of about 53, one slow crossing.

- **The MoveForward fix is the main lever.** Without it, a creature with MoveForward runs fast into the wall and stays
  there. With it, the push stops at the wall and other genes can take it back, so speed and turning can coexist:
  survivors move about 180 cells instead of 90.
- **Removing the stopped penalty does not help on its own,** and with the small genome it does nothing. Together with
  the fix and the bigger genome, turning appears in every seed.
- **The turns are still timers.** Only 7 to 12 % of the reversals happen within 3 cells of a border (36 % in one
  seed): Age, through a neuron or directly (`Age → MoveNorth` against a constant neuron → MoveSouth, 4 genes), flips the
  direction at a given time. None evolved a reaction to the wall. No sensor says which wall is near, and with random
  start positions a timer is still good enough.

## Ideas not tried

- (Done: the MoveForward fix is part of the engine.)
- A sensor that tells which wall is near, or blocked-move sensors, to see if wall bouncing appears.
- More seeds for the touch condition.
