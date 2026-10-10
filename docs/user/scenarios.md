# Scenarios

These scenarios are in the **Start** tab. Their files are in `public/`. You can load one, change it in Settings or in the Map tab, and save it as your own.

All of them use the classic model: *Inside Reproduction Area* selection, and movement actions only.

| Scenario | Map | Population | Brain | Starts at |
|---|---|---|---|---|
| davidrmiller example 1 | Reproduction area on the right half | 1000 | 4 genes, 1 neuron | generation 1 |
| davidrmiller example 2 | Reproduction areas on both the left and right edges | 1000 | 4 genes, 1 neuron | generation 1 |
| davidrmiller example 2 with vertical bars | As example 2, plus five vertical walls | 1000 | 4 genes, 1 neuron | generation 1 |
| davidrmiller example 4 (without kill) | Circular reproduction area in the centre | 3000 | 8 genes, 2 neurons | generation 1 |
| davidrmiller example 4 generation 2600 | The same, already evolved | 1000 | 8 genes, 2 neurons | evolved run |
| Vertical boxes | Spawn top-left; five vertical walls at the bottom; reproduction in the second box | 500 | up to 30 genes, 15 neurons | generation 1 |
| Turn right | Spawn top-left above a wall; reproduction bottom-left | 500 | up to 30 genes, 15 neurons | generation 1 |
| Turn right 3SF generation 1013 | The same, with a small brain | 500 | up to 9 genes, 2 neurons | evolved run |
| Turn right generation 5574 | The same | 500 | up to 30 genes, 15 neurons | evolved run |
| Carlos' original | Reproduction square in the centre; diagonal of obstacles | 500 | up to 30 genes, 15 neurons | generation 1 |
| NW7 generation 13780 | Spawn at the top; staggered walls; reproduction strip at the bottom | 100 | up to 6 genes, 1 neuron | evolved run |

## What to look for

**davidrmiller examples.** These reproduce the demos in David R. Miller's video. Example 1 learns "go right" in a few generations. Example 2 must split the population between two opposite goals. Example 4 must learn to stop *inside* a circle, not just reach an edge.

**Vertical boxes.** Only one of the boxes between the walls is a reproduction area. Creatures must learn to fall into the right one, which requires a sense of horizontal position.

**Turn right.** The spawn area sits above a wall, and the reproduction area is below it, on the same side. Going straight down does not work: creatures must go right, around the end of the wall, and come back left. Compare generation 1 with the evolved runs to see the strategy emerge. The 3SF run solves it with a much smaller brain.

![Turn right after 5583 generations](../turn%20right%20generation%205583.gif)

**Carlos' original.** The scenario of the original port: creatures learn to stay in the centre.

**NW7.** A small population with tiny brains, after 13780 generations, finding its way through staggered walls.

## Older saved runs

`_scenarios/` and `_simulation_examples_/` hold more saved runs from development, some with GIFs and stats screenshots. Load them with **Files → Load**. Some come from older versions and use features that are now experimental.
