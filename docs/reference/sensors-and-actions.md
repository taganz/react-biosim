# Sensors, actions and genes reference

A creature's brain is a small neural network. **Sensors** are its inputs, **actions** are its outputs, and internal **neurons** sit in between. Each **gene** in the genome is one connection between two of them.

Sensors and actions are switched on and off in **Settings → Sensors / Actions**. Source code: [CreatureSensors.ts](../../simulation/creature/brain/CreatureSensors.ts) and [CreatureActions.ts](../../simulation/creature/brain/CreatureActions.ts).

## Genus

Every creature belongs to a **genus** (its trophic level), worked out from the actions its genes connect to ([CreatureGenus.ts](../../simulation/creature/CreatureGenus.ts)):

| Genus | Common name | Rule | Colour in `trophicLevel` mode |
|---|---|---|---|
| `attack_animal` | carnivore | has a gene connected to **AttackAnimal** | red |
| `attack_plant` | herbivore | otherwise, has a gene connected to **AttackPlant** | blue |
| `plant` | plant | otherwise, has a gene connected to **Photosynthesis** | green |
| `unknown` | — | none of the above | black |

Each sensor and action also lists the genera it is **compatible** with. This only matters for strategies that build genomes for a given genus: Random Fixed Gene, Continuous and Plant/Herbivore. Random genomes can connect any sensor to any action.

## Sensors

Sensor outputs are mostly between 0 and 1. Genus columns: P = plant, H = herbivore, C = carnivore.

| # | Sensor | Output | P | H | C |
|---|---|---|---|---|---|
| 0 | HorizontalPosition | x position ÷ world size. 0 at the left edge, 1 at the right edge. | ✓ | ✓ | ✓ |
| 1 | VerticalPosition | y position ÷ world size. 0 at the top, 1 at the bottom. | ✓ | ✓ | ✓ |
| 2 | Age | Current step ÷ steps per generation. All creatures share it: it measures time in the generation, not the age of the creature. | ✓ | ✓ | ✓ |
| 3 | Oscillator | `(sin(step / 10) + 1) / 2`, a wave with a period of about 63 steps. | ✓ | ✓ | ✓ |
| 4 | Random | A new random number in [0, 1) every step. | ✓ | ✓ | ✓ |
| 5 | HorizontalSpeed | Last horizontal move: 0 = left, 0.5 = still, 1 = right. | | ✓ | ✓ |
| 6 | VerticalSpeed | Last vertical move: 0 = up, 0.5 = still, 1 = down. | | ✓ | ✓ |
| 7 | HorizontalBorderDistance | Distance to the nearest left or right edge: 0 at the edge, 1 at the centre. | ✓ | ✓ | ✓ |
| 8 | VerticalBorderDistance | Distance to the nearest top or bottom edge: 0 at the edge, 1 at the centre. | ✓ | ✓ | ✓ |
| 9 | BorderDistance | The smaller of the two border distances. | ✓ | ✓ | ✓ |
| 10 | TouchNorth | 1 if the cell above holds a creature or an obstacle, or is outside the world. Otherwise 0. | ✓ | ✓ | ✓ |
| 11 | TouchEast | The same for the cell to the right. | ✓ | ✓ | ✓ |
| 12 | TouchSouth | The same for the cell below. | ✓ | ✓ | ✓ |
| 13 | TouchWest | The same for the cell to the left. | ✓ | ✓ | ✓ |
| 14 | Pain | `(100 − health) / 100`. Always 0 at present, because health areas are disabled. | ✓ | ✓ | ✓ |
| 15 | PopulationDensity | Share of the 8 neighbouring cells that hold a creature. | ✓ | ✓ | ✓ |
| 16 | Mass | The creature's mass. Not scaled to 0–1. | ✓ | ✓ | ✓ |
| 17 | PreyDistance | Distance in cells to the closest prey within `DETECT_RADIUS` (10), with diagonal steps counting as 1. 999999 if there is none. Not scaled to 0–1. | | ✓ | ✓ |
| 18 | PreyNorth | 1 if the closest prey is above. Otherwise 0. | | ✓ | ✓ |
| 19 | PreyEast | 1 if the closest prey is to the right. | | ✓ | ✓ |
| 20 | PreySouth | 1 if the closest prey is below. | | ✓ | ✓ |
| 21 | PreyWest | 1 if the closest prey is to the left. | | ✓ | ✓ |
| 22 | PredatorDistance | Not implemented yet (see [known issues](#known-issues)). | | ✓ | |
| 23 | PredatorDirection | Not implemented yet (see [known issues](#known-issues)). | | ✓ | |

The # column is the position in the full list. Genes do not use this number: they use the position among the **enabled** sensors (see [Gene encoding](#gene-encoding)).

## Actions

Each action reads the output of its neuron once per step. Unless stated otherwise, the action runs when the output is above 0.

| # | Action | Effect | P | H | C |
|---|---|---|---|---|---|
| 0 | MoveNorth | Adds an urge to move up, as strong as the output. | | ✓ | ✓ |
| 1 | MoveSouth | Adds an urge to move down. | | ✓ | ✓ |
| 2 | MoveEast | Adds an urge to move right. | | ✓ | ✓ |
| 3 | MoveWest | Adds an urge to move left. | | ✓ | ✓ |
| 4 | RandomMove | Adds an urge to move in a random direction. | | ✓ | ✓ |
| 5 | MoveForward | Repeats the last move. | | ✓ | ✓ |
| 6 | Photosynthesis | Turns water from the creature's cell into mass. | ✓ | | |
| 7 | Reproduction | Creates a child in a free nearby cell, if the creature has enough mass. Used by the continuous strategies. | ✓ | ✓ | ✓ |
| 8 | AttackPlant | Only when the output is above `ACTION_REPRODUCTION_OFFSET` (0.6). Attacks a creature in one of the 4 neighbouring cells. | | ✓ | ✓ |
| 9 | AttackAnimal | The same as AttackPlant. Only the genus it gives the creature differs. | | | ✓ |

**Movement.** The urges from all movement actions are added up separately for x and for y. On each axis the creature moves one cell, in the direction of the urge, with probability `|tanh(urge)|`. So it moves at most one cell per axis per step, and only if the target cell is free.

**Prey.** Herbivores hunt plants and carnivores hunt herbivores. Plants have no prey, so the prey sensors read "no prey" for them.

**Attack.** An attack fails if the prey has the same genus as the attacker, or if the attacker is not at least `ATTACK_MIN_PREY_MASS_FACTOR` (2) times heavier than the prey. A successful attack kills the prey.

## Gene encoding

A gene is a 32-bit integer ([Genome.ts](../../simulation/creature/brain/Genome.ts)):

| Bits | Field | Meaning |
|---|---|---|
| 31 | source type | 1 = sensor, 0 = internal neuron |
| 24–30 | source id | 7 bits |
| 23 | sink type | 1 = action, 0 = internal neuron |
| 16–22 | sink id | 7 bits |
| 0–15 | weight | `value / 8192 − 4`, so between −4 and +4 |

Ids are reduced with a modulo when the gene is decoded:

- A sensor id is taken modulo the number of **enabled** sensors.
- An action id is taken modulo the number of **enabled** actions.
- A neuron id is taken modulo **Max neurons**.

So the same gene can mean different connections in simulations with different sensors or actions enabled.

## Known issues

- **PredatorDistance and PredatorDirection produce no value.** They are in the list and can be enabled, but `calculateOutputs` never computes them. If you enable one, the sensor values no longer line up with the sensor neurons. Keep them disabled.
- **Reproduction never succeeds without metabolism.** It needs more than 3 × birth mass, and without metabolism mass never changes (see [Creatures → Reproduction](../model/creatures.md#reproduction)).
- **The genus of a creature is read from its actions only.** Sensors never set the genus, so the "compatible genus" lists of sensors only matter when genomes are built for a given genus.
