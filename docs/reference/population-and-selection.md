# Population strategies and selection methods reference

A simulation runs in **generations**. Each generation lasts **Steps per generation** steps, and two pluggable pieces drive it:

1. At the **start** of a generation, the **population strategy** places creatures on the map. From generation 2 on, it uses the survivors of the previous generation as parents.
2. At the **end** of a generation, the **selection method** decides which creatures survive and become parents. It also computes the **fitness** value plotted in the Stats tab.

Both are chosen in **Settings → Generations**. Options marked *(in dev)* in the UI are experimental.

## Population strategies

Source: [simulation/generations/population/](../../simulation/generations/population/). The UI label is listed first and the class name, which is also the value stored in saved files, in brackets.

### Asexual Random (`AsexualRandomPopulation`)

The classic model from David R. Miller's video.

- **Generation 1:** creates **Initial population** creatures with random genomes, in random free cells.
- **Next generations:** every survivor has at least one child, and extra children are shared out until the population reaches **Initial population**. A child is a copy of its parent's genome, with possible [mutations](parameters.md#mutations), placed in a random free cell.
- If there are more survivors than **Initial population**, a random subset of them has one child each.

### Asexual Zone (`AsexualZonePopulation`)

Works like Asexual Random, but places creatures inside the first **spawn area** on the map. If the map has no spawn area, it behaves exactly like Asexual Random.

### Random Fixed Gene (`RandomFixedGenePopulation`) *(in dev)*

- **Generation 1:** for each creature, picks a genus at random using the probabilities in `constants.POPULATION_DEFAULT_GENUS`. It then builds a genome of **Initial genome size** genes for that genus: one gene that defines the genus plus random compatible genes.
- **Next generations:** every survivor has `ceil(initial population ÷ survivors)` children, so the population can end up slightly above the target.

### Continuous (`ContinuousPopulation`) *(in dev)*

Makes each generation a continuation of the previous one. Use it with the Continuous selection method.

- **Generation 1:** creates creatures with a genus taken from `constants.POPULATION_DEFAULT_GENUS` and 4-gene genomes.
- **Next generations:** keeps the creatures that were born during the previous generation, in the same place.

### Plant/Herbivore (`PlantHerbivorePopulation`) *(in dev)*

A predator–prey experiment. Use it with the Greatest Mass selection method.

- Every generation is 80% plants and 20% herbivores.
- **Generation 1:** both groups are built from their genus.
- **Next generations:** herbivores are children of the surviving herbivores. Plants are created again from scratch, so only herbivores evolve.

## Selection methods

Source: [simulation/generations/selection/](../../simulation/generations/selection/).

| UI label | Class | Who survives | Fitness value (Stats tab) |
|---|---|---|---|
| Inside Reproduction Area | `InsideReproductionAreaSelection` | Living creatures standing inside a **reproduction area** when the generation ends. | Survival rate: survivors ÷ initial population × 100 |
| Greatest Distance *(in dev)* | `GreatestDistanceSelection` | The 5% of creatures that travelled furthest during the generation (`GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS`). | Largest distance covered |
| Greatest Mass *(in dev)* | `GreatestMassSelection` | Herbivores only, ranked by mass. The number kept is 5% of **all** creatures (`GREATEST_MASS_SELECTION_TOP_SURVIVORS`). | Largest mass |
| Reproduction *(in dev)* | `ReproductionSelection` | Living creatures that were born during the generation. | Number of survivors |
| Continuous *(in dev)* | `ContinuousSelection` | All current creatures. | Number of creatures |

Reproduction and Continuous are *continuous* methods: creatures reproduce during the generation with the **Reproduction** action, instead of only at the end.

## Combinations that work

| Goal | Population strategy | Selection method |
|---|---|---|
| Learn to reach a zone (as in the video) | Asexual Random or Asexual Zone | Inside Reproduction Area |
| Learn to travel far | Asexual Random | Greatest Distance |
| Plants and herbivores | Plant/Herbivore | Greatest Mass |
| Open-ended, no generations | Continuous | Continuous |

## Adding a new strategy or method

1. Create a class that implements [PopulationStrategy](../../simulation/generations/population/PopulationStrategy.ts) or [SelectionMethod](../../simulation/generations/selection/SelectionMethod.ts).
2. Register it in [populationStrategyOptions.ts](../../simulation/generations/population/populationStrategyOptions.ts) or [selectionMethodOptions.ts](../../simulation/generations/selection/selectionMethodOptions.ts). Add it both to the options list, which feeds the UI dropdown, and to the map, which is used to load saved files. The `name` field must match the map key.

## Known issues

- **Continuous population is broken in generation 1.** It passes a whole `{genus, probability}` entry where a genus name is expected ([ContinuousPopulation.ts](../../simulation/generations/population/ContinuousPopulation.ts)), so the genomes it builds are not valid.
- **Greatest Mass crashes without herbivores.** It reads `parents[0]` for a log message without checking that there is one ([GreatestMassSelection.ts](../../simulation/generations/selection/GreatestMassSelection.ts)). Plant/Herbivore throws an error if it receives parents that are not herbivores.
- **Greatest Distance can select dead creatures,** because it does not check `isAlive`.
- **Asexual Zone ignores the spawn area when there are more survivors than Initial population.** In that case it places children in random cells.
- **Random Fixed Gene and Continuous** depend on `POPULATION_DEFAULT_GENUS`, which is empty in the startup scenario.
