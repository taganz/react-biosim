# Sensors, actions and genes reference

A creature's brain is a small neural network. **Sensors** are its inputs, **actions** are its outputs, and internal **neurons** sit in between. Each **gene** in the genome is one connection between two of them.

Sensors and actions are switched on and off in **Scenario → Sensors / Actions**. Source code: [CreatureSensors.ts](../../simulation/creature/brain/CreatureSensors.ts) and [CreatureActions.ts](../../simulation/creature/brain/CreatureActions.ts).

## Genus

Every creature belongs to a **genus** (its trophic level), worked out from the actions its genes connect to ([CreatureGenus.ts](../../simulation/creature/CreatureGenus.ts)):

| Genus | Common name | Rule | Colour in `trophicLevel` mode |
|---|---|---|---|
| `attack_animal` | carnivore | has a gene connected to **AttackAnimal** | red |
| `attack_plant` | herbivore | otherwise, has a gene connected to **AttackPlant** | blue |
| `plant` | plant | otherwise, has a gene connected to **Photosynthesis** | green |
| `unknown` | — | none of the above | black |

Each sensor and action also lists the genera it is **compatible** with. This only matters for strategies that build genomes for a given genus: Random Fixed Genera and Plant/Herbivore. Random genomes can connect any sensor to any action.

## Sensors

Sensor outputs are mostly between 0 and 1. Genus columns: P = plant, H = herbivore, C = carnivore.

| # | Sensor | Output | P | H | C |
|---|---|---|---|---|---|
| 0 | HorizontalPosition | x position ÷ world size. 0 at the left edge, 1 at the right edge. | ✓ | ✓ | ✓ |
| 1 | VerticalPosition | y position ÷ world size. 0 at the top, 1 at the bottom. | ✓ | ✓ | ✓ |
| 2 | Age | Generational runs: current step ÷ steps per generation. All creatures share it: it measures time in the generation, not the age of the creature. Continuous runs: the creature's age ÷ **Maximum age**. | ✓ | ✓ | ✓ |
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
| 24 | PreyProximity | How close the closest prey is: `(DETECT_RADIUS + 1 − distance) / DETECT_RADIUS`, so 1 for a neighbour (diagonals included) and `1 / DETECT_RADIUS` at the edge of the radius. 0 if there is none. Unlike PreyDistance it is between 0 and 1 and grows as the prey gets closer. Disabled by default. | | ✓ | ✓ |

The # column is the position in the full list. Genes do not use this number: they use the position among the **enabled** sensors (see [Gene encoding](#gene-encoding)).

## Actions

Each action reads the output of its neuron once per step in which the brain runs (every step, unless the Stamina action is enabled). Unless stated otherwise, the action runs when the output is above 0.

| # | Action | Effect | P | H | C |
|---|---|---|---|---|---|
| 0 | MoveNorth | Adds an urge to move up, as strong as the output. | | ✓ | ✓ |
| 1 | MoveSouth | Adds an urge to move down. | | ✓ | ✓ |
| 2 | MoveEast | Adds an urge to move right. | | ✓ | ✓ |
| 3 | MoveWest | Adds an urge to move left. | | ✓ | ✓ |
| 4 | RandomMove | Adds an urge to move in a random direction. | | ✓ | ✓ |
| 5 | MoveForward | Repeats the last move. | | ✓ | ✓ |
| 6 | Photosynthesis | Turns water from the creature's cell into mass. | ✓ | | |
| 7 | Reproduction | Creates a child in a free cell as far as possible, up to `REPRODUCTION_OFFSPRING_MAX_DISTANCE_PERCENT` (4 %) of the world size away, if the creature has enough mass. With no free cell, herbivores and carnivores eat a neighbour to make room. Needed in continuous runs, where it is the only way creatures are born. | ✓ | ✓ | ✓ |
| 8 | AttackPlant | Only when the output is above `ACTION_ATTACK_OFFSET` (0.6). Attacks a creature it can eat in one of the 4 neighbouring cells. | | ✓ | ✓ |
| 9 | AttackAnimal | The same as AttackPlant. Only the genus it gives the creature differs. | | | ✓ |
| 10 | Stamina | Not executed: the weight of the first gene that drives it sets the creature's stamina, how often its brain runs. Disabled by default. See [Stamina](#stamina). | ✓ | ✓ | ✓ |
| 11 | MoveToPrey | Adds an urge to move towards the closest prey, the one the prey sensors see, as strong as the output on each axis that leads to it. Disabled by default. See [MoveToPrey](#movetoprey). | | ✓ | ✓ |

**Movement.** The urges from all movement actions are added up separately for x and for y. On each axis the creature moves one cell, in the direction of the urge, with probability `|tanh(urge)|`. So it moves at most one cell per axis per step, and only if the target cell is free.

**Prey.** Herbivores hunt plants and carnivores hunt herbivores. Plants have no prey, so the prey sensors read "no prey" for them.

**MoveToPrey.** With one gene the creature heads for its closest prey, which with the direction sensors takes four (PreyNorth → MoveNorth and so on). The prey is the one found at the start of the thought, within `DETECT_RADIUS`, by the same search as the prey sensors.
- Further than one cell, it urges towards the prey on both axes, or on one if the prey is in line.
- Next to the prey (N, E, S or W), where AttackPlant and AttackAnimal reach it, it adds no urge.
- With the prey in a diagonal neighbour cell, which an attack cannot reach, it urges on one axis only, to a free cell beside the prey: horizontally if that cell is free, otherwise vertically, otherwise not at all.
- It looks only for the prey genus, like the sensors. It also heads for prey too heavy to eat (see [Attack](#actions)).
- In the steps a creature does not think (Stamina), the urge stays, like the other movement actions.

**Sensors a brain does not read.** A brain computes only the sensors that one of its connections reads; the others stay at 0, a value nothing reads. Which sensors a brain reads is decided once, when the brain is built. This matters for two sensors: the six prey sensors share one search, the most expensive sensor, which a brain with no connection from them and none to MoveToPrey skips (MoveToPrey uses the same search); and the Random sensor draws a number only for a brain that reads it, so brains that do not read it leave the random sequence alone.

**Attack.** The target is a neighbour the attacker can eat: one of a different genus (with `ATTACK_SAME_GENUS`, also another species of its genus), at most half as heavy as the attacker (`ATTACK_MIN_PREY_MASS_FACTOR`, 2). Neighbours that cannot be eaten are skipped, and with none the action does nothing. A successful attack kills the prey. See [Creatures → Attack](../model/creatures.md#attack).

## Stamina

With the **Stamina** action enabled, each creature has a *stamina* between `STAMINA_MIN` (0.05) and 1: the share of the steps in which its brain runs. Without the action every creature has stamina 1 and thinks every step, as before.

- **Where it comes from.** Stamina is in the genome: the gene whose sink is the Stamina action gives it, from its weight (−4 to +4 becomes 0 to 1, then kept between `STAMINA_MIN` and 1). The source of that gene does not matter. It is read once, at birth.
- **Always one Stamina gene.** With the action enabled, every genome has exactly one Stamina gene. The random genes of new genomes never target Stamina; instead `WorldGenerations.newCreature()` adds one Stamina gene, with a random stamina between 0 and 1 (uniform), to any new genome without it: the genomes of generation 1 (so they have *Initial genome size* + 1 genes), genomes loaded from older files, and the children of creatures without one. Creatures restored as they were, by resuming a file or by *Update simulation*, keep their genome; without a Stamina gene they have `STAMINA_DEFAULT` (1).
- **Mutation.** When cloning picks the Stamina gene for a point mutation, whatever the mutation mode, only its weight changes: the stamina moves a random amount of at most `STAMINA_MUTATION_STEP` (0.05) up or down. Deletions never remove it, and at least one other gene stays. A point mutation that would turn another gene into a Stamina gene is dropped, and an inserted gene is drawn again until it is not one. So the stamina evolves gradually.
- **Not part of the network.** Stamina genes are left out of the brain: they read no sensor, feed no neuron and do not show in the network diagram. They cost no basal consumption, since every genome has one. They count towards *Max genome size*. The Population tab shows the stamina and the gene that sets it above the diagram and in the Genome section.
- **When the brain runs.** Every step the creature adds its stamina to a charge; when the charge reaches 1 the brain runs and 1 is subtracted. A stamina of 0.25 thinks one step in four. The charge starts at a random value at birth, so creatures with the same stamina do not think in the same steps. That draw happens only for stamina below 1, so runs without the Stamina action repeat as before.
- **Inertia.** In the steps it does not think, the creature keeps the urge to move of its last thought and still moves (paying the move costs), but does no other action: no photosynthesis, reproduction or attack.
- **Cost.** The genes cost basal consumption every step (`MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY` and `MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE`; the Stamina gene never): the upkeep of the brain. Thinking costs on top of that: in every step the brain runs, the creature pays the cost of each sensor it reads and each action it is connected to (`MASS_COST_PER_SENSOR`, `MASS_COST_PER_ACTION`, or the sensor's or action's own cost). With thinking costs above the upkeep, the real cost of a brain depends mostly on the stamina. Whether a high or a low stamina pays off depends on what a thought brings in: a thought that earns more than it costs (a plant's photosynthesis, for example) favours a high stamina.
- **Sensors.** A brain reads its sensors only when it runs, so they show the world at that step. The speed sensors give the move of the step before. The neurons' memory (the previous output) is the one of the previous thought, not of the previous step. The Oscillator (period about 63 steps) is sampled at least every 20 steps with the default `STAMINA_MIN`, often enough to follow it.
- **Old genomes.** Enabling the action changes the number of enabled actions, so every action gene of a genome saved with another list of actions points to a different action (see [Gene encoding](#gene-encoding)). Enable it for new runs.

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

- **PredatorDistance and PredatorDirection produce no value.** The engine never computes them, so they are disabled by default. They can still be enabled in the Scenario tab: genes that read them then get no value, and the brain computes `NaN`. Keep them disabled.
- **Reproduction never succeeds without metabolism.** It needs more than 3 × birth mass, and without metabolism mass never changes (see [Creatures → Reproduction](../model/creatures.md#reproduction)).
- **The prey sensors and MoveToPrey never see the last row and column of the world.** `detectClosest` clamps the search area to `size − 1` and uses it as an exclusive end. It is kept so that existing simulations behave the same.
- **Plants with prey sensors or MoveToPrey detect any creature.** Plants have no prey genus (`preyGenus` is `undefined`), and `detectClosest` without a genus returns the closest creature of any genus.
- **The genus of a creature is read from its actions only.** Sensors never set the genus, so the "compatible genus" lists of sensors only matter when genomes are built for a given genus.
