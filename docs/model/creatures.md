# Creatures

Source: [simulation/creature/](../../simulation/creature/), mainly [Creature.ts](../../simulation/creature/Creature.ts).

A creature has:

- a **position** (one cell);
- a **genome** and the **brain** built from it (see [Brain and genome](brain.md));
- a **genus** derived from the genome;
- **mass** (only changes with metabolism) and **health**;
- an **id**, its birth step and its age, plus counters used by the selection methods (`distanceCovered`);
- a **life history**, used only to show it in the Population tab (see [Life history](#life-history)).

## Birth

A creature is created by the population strategy, or by another creature through the **Reproduction** action.

- **Generation 1:** usually a random genome of **Initial genome size** genes. Some strategies build genomes for a given genus instead.
- **Later generations:** a copy of the parent's genome, which may mutate (see [Mutation](brain.md#mutation)).
- The **genus** is worked out from the new genome, so a mutation can turn an animal into a plant or the other way round.
- **Birth mass** depends on the genus: `MASS_AT_BIRTH_PLANT` for plants and for `unknown`, `MASS_AT_BIRTH_ATTACK_PLANT` for animals. With metabolism on, generation-1 creatures take that mass from the cloud's water.
- **Health** starts at 100.

## One step

At every step, each living creature runs `computeStep()`, in this order:

1. **Age.** In continuous runs, if its age is above **Maximum age**, it dies of old age. In generational runs the limit is *Steps per generation* + 1, so it never applies: creatures are replaced first.
2. **Basal metabolism.** It spends `MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY` for each primary gene (the first gene that drives Reproduction and, in plants only, the first that drives Photosynthesis) and `MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE` for every other gene except the Stamina gene, so bigger genomes cost more. In the steps its brain runs (every step, unless the Stamina action is enabled) it also pays the thinking cost: the cost of each sensor its brain reads and each action it is connected to (`MASS_COST_PER_SENSOR`, `MASS_COST_PER_ACTION`).
3. **Think and act.** It reads its sensors, runs its network and executes the actions (see [Brain and genome](brain.md)). Movement actions only add to an *urge to move*. Photosynthesis, Reproduction and Attack happen straight away. With the Stamina action enabled, the brain runs only in a share of the steps equal to the creature's stamina; in the other steps the creature keeps the urge to move of its last thought and does no other action (see [Stamina](../reference/sensors-and-actions.md#stamina)).
4. **Move.** The urge to move is resolved (see [Movement](#movement)).
5. **Distance index.** The `distanceCovered` counter is updated (see [Distance index](#distance-index)).

A creature that runs out of mass at any point dies, and the rest of its step is skipped.

The creatures of a generation are processed **one after another**, not all at once. A creature that moves early in the step frees its old cell, or takes a new one, before the next creature acts. Dead creatures are removed from the grid straight away.

## Movement

The movement actions (MoveNorth, MoveSouth, MoveEast, MoveWest, RandomMove, MoveForward) each add a vector to the creature's urge to move. At the end of the step:

```
moveX = tanh(urgeX)          probability of moving one cell in x = |moveX|
moveY = tanh(urgeY)          probability of moving one cell in y = |moveY|
```

- Each axis is decided separately, so a creature can move diagonally.
- The move only happens if the target cell is inside the world and empty. A diagonal move is also blocked when both cells beside the diagonal are occupied, so creatures cannot slip between two blocked cells.
- With metabolism on, every attempt costs `MOVE_COST_PER_MASS × birth mass`, also when the target cell is blocked. A creature needs more than `MOVE_MULTIPLE_MASS_AT_BIRTH` plus that cost, times its birth mass, to move, so moving never leaves it without mass. A creature that is too light does not try and loses nothing.
- A move that fails, because it is blocked or the creature is too light, sets the last movement to (0, 0). MoveForward repeats the last movement, so it stops pushing into a wall or a neighbour instead of trying the same move for ever.

A strong urge (an action output close to 1) makes movement almost certain. A weak one makes it occasional, which is where much of the randomness in early generations comes from.

## Distance index

`distanceCovered` is the fitness used by **Greatest Distance** selection. It does not count every cell travelled. It rewards **long straight runs**:

- When the creature keeps moving in the same direction, a run counter grows, and stops growing at 120. Once the run is longer than 35 steps, each further step adds 1 to `distanceCovered`, also after the counter has reached 120.
- Changing direction resets the run counter.
- After 100 steps without moving, each further still step takes 1 from `distanceCovered` (down to 0).

The 35, 120 and 100 thresholds are constants in `Creature.ts` and are not in the settings.

## Mass and metabolism

When **metabolism** is off (the default in the classic scenarios), mass never changes and none of this section applies.

When it is on, mass is the creature's energy:

| Gains mass | Loses mass |
|---|---|
| **Photosynthesis:** takes `MASS_WATER_TO_MASS_PER_STEP × action output` of water from its cell, or less if it would go over its maximum mass. It gains the [assimilation efficiency](#assimilation-efficiency) of that water. | Basal metabolism and action cost, every step |
| **Attack:** a successful attack takes the prey's mass, up to the maximum mass, and gains the assimilation efficiency of it. What it does not take returns to the prey's cell when it dies. | Moving, attacking, reproducing (see [parameters](../reference/parameters.md#metabolism-constants-worldcontrollerdata)) |

- Mass is capped at `MASS_MAX_MULTIPLE_MASS_AT_BIRT × birth mass`.
- A creature with no mass left dies.
- All mass is water, so it is conserved (see [World → Water](world.md#water)). A child's birth mass comes from its parent; in generational runs, the mass of each new generation comes from the cloud.

### Assimilation efficiency

Not everything a creature takes becomes its own mass. `ASSIMILATION_EFFICIENCY` gives, for each genus (plant, animal), the share that does, separately for the two ways of gaining mass:

- **`photosynthesis`**: of the water taken from the cell;
- **`prey`**: of the prey's mass, in an attack. Only animals have it, since plants never eat.

The rest goes to the cloud, like the mass spent on metabolism: it is the energy lost between trophic levels. It does not go to the cell, which would water the plants right next to the creature that ate.

- With 1 (the startup value, and the value of any genus or source missing from a file) everything becomes mass, as before the setting existed.
- With 0 the creature takes nothing: an animal with photosynthesis 0 cannot photosynthesise, and an attacker with prey 0 kills its prey without gaining anything, so all the prey's mass returns to its cell.
- Values are kept between 0 and 1.
- **Uptake and efficiency are separate.** The uptake stays as it was (`MASS_WATER_TO_MASS_PER_STEP` per step, or the whole prey), and the efficiency is applied to what is taken. So a plant with efficiency 0.5 takes the same water from its cell but grows half as fast.
- **The maximum mass applies after the efficiency.** A creature takes only as much as fits below its maximum mass once assimilated. Near the maximum, an animal with prey efficiency 0.5 and room for 1 takes 2 of the prey: it gains 1, 1 goes to the cloud, and the rest of the prey returns to the prey's cell.
- Creatures of genus `unknown` have neither photosynthesis nor attack genes, so they have no row.

### Reproduction

The **Reproduction** action creates a child during the generation, at most `REPRODUCTION_OFFSPRING_MAX_DISTANCE_PERCENT` (4 %) of the world size from the parent. The percentage is rounded to whole cells and is at least 1 cell: 4 cells in the default world of 100, 1 cell in a world of 30.

- The parent needs more than `REPRODUCTION_MULTIPLE_MASS_AT_BIRTH × birth mass`. With metabolism on, it also needs `REPRODUCTION_COST_PER_MASS_DO × birth mass` on top. Without that mass the action does nothing: it is not an attempt and costs nothing.
- The child goes to a free cell **as far from the parent as possible**. The distance counts steps to any of the 8 neighbours, so the cells at distance *d* form the square ring of side 2*d* + 1 around the parent. The child is born in a free cell of the farthest ring that has one, chosen at random within that ring; if that ring is full, the next one inward is tried, down to the 8 cells around. Obstacles between the parent and the cell do not matter, and cells outside the world do not count. When the distance comes to 1 cell (for example with the setting at 0), the child is born in one of the 8 cells around, as before.
- If no cell within that distance is free, the child is not born. A parent never kills a neighbour to make room: crowded areas limit reproduction.
- A successful reproduction costs `REPRODUCTION_COST_PER_MASS_DO × birth mass`, plus the birth mass handed to the child.
- An attempt with no free cell costs `REPRODUCTION_COST_PER_MASS_TRY × birth mass`.

> **Known issue.** With metabolism off, mass never changes, so it can never exceed `REPRODUCTION_MULTIPLE_MASS_AT_BIRTH` (3) × birth mass. The Reproduction action therefore never succeeds unless metabolism is on.

### Attack

**Attack** fires when its output is above `ACTION_ATTACK_OFFSET` (0.6) and one of the 4 neighbouring cells (N, E, S, W) holds a creature the attacker can eat: alive, of a **different genus** (see `ATTACK_SAME_GENUS` below), and with at most `1 / ATTACK_MIN_PREY_MASS_FACTOR` (half) of the attacker's mass. If several can be eaten, one is chosen at random; neighbours that cannot be eaten are skipped, and with none the action does nothing. Plants never eat. The attack:

1. costs `ATTACK_COST_PER_MASS × birth mass`, whether it succeeds or not. Whether the prey can be eaten is decided before paying it. There is no minimum mass to attack: a creature lighter than that cost dies trying;
2. kills the target, and the attacker gains the target's mass, up to its maximum mass, times its [assimilation efficiency](#assimilation-efficiency) for prey.

The genus of the target is otherwise not checked: an animal can also kill a creature of genus `unknown`.

With `ATTACK_SAME_GENUS` on, the target can also be of the attacker's genus, as long as it is of another [species](#species), that is, its genome is not identical. The prey sensors and the MoveToPrey action do not change: they still look only for the prey genus, so a creature cannot sense or chase the relatives it can eat.

## Genus

| Genus | Common name | Has a gene connected to | Hunts |
|---|---|---|---|
| `attack_plant` | animal | Attack | plants |
| `plant` | plant | Photosynthesis (and no attack) | — |
| `unknown` | — | none of these | — |

Only actions decide the genus. A creature whose genome connects to Photosynthesis *and* Attack is an animal. When the scenario uses `trophicLevel` colouring, plants are drawn green and animals blue, with shades that depend on the genome.

There used to be a third genus, the carnivore (`attack_animal`), with its own action, AttackAnimal, which did the same as the animal's. Both actions are now one, Attack, and files saved with carnivores load them as animals (see [Save format](../development/serialization.md#compatibility)). With `ATTACK_SAME_GENUS` on, animals can eat other species of animals, a kind of carnivory that can evolve on its own.

## Species

A **species** is a lineage: a genome and the species it came from ([speciesId.ts](../../simulation/creature/speciesId.ts)). A child born with exactly its parent's genome keeps its parent's species; a child with another genome starts a new species whose id is computed from its genes and its parent's species; a creature without a parent starts a root species. Every creature carries `speciesId` and `speciesParentId`, and the engine keeps the species seen in the current generation in a [SpeciesRegistry](../../simulation/generations/SpeciesRegistry.ts) for the log. The Population tab groups the creatures by `speciesId` at the start of every generation. See [The log files](../reference/log-file.md#species). A species' colour is computed from the values of its genes, so close relatives often have similar colours.

## Death

A creature dies when:

- its mass reaches 0 (metabolism only);
- its health reaches 0. Nothing lowers health at present, because health areas are disabled;
- it is killed by an attack;
- it is older than **Maximum age** (continuous runs only).

When it dies, its remaining mass goes back to its cell as water, and it is removed from the grid. In the classic model creatures do not die during a generation: they simply fail to be selected at the end.

## Life history

Each creature keeps these values. Nothing in the simulation reads them; they are shown in the [Population tab](../user/population-and-brains.md#selected-creature).

| Field | Meaning |
|---|---|
| `parentId`, `parentBirthGen` | The creature its genome was copied from, and the generation that parent was born in. Both are set by `newCreature()` when it gets a parent: through the Reproduction action, or by the population strategy at the start of a generation. They are `null` for random genomes of generation 1. Most selection methods restart the ids at 1 every generation, so the id alone does not identify the parent. |
| `birthGen` | The generation it was born in. `stepBirth` is the step within that generation. |
| `childrenCount` | How many creatures got their genome from it. |
| `attackCount` | Attack actions executed. |
| `plantKillCount`, `animalKillCount` | Prey killed, split by the prey's genus like the mass eaten: plants, and the other genera. `killCount` is their sum. |
| `waterFromPhotosynthesis` | Total mass gained by Photosynthesis: the water taken from its cell times the [assimilation efficiency](#assimilation-efficiency). |
| `waterFromPlants`, `waterFromAnimals` | Total mass gained from the prey it killed, split by the prey's genus: plants, and the other genera (other animals, or `unknown`). Each is what fitted below its maximum mass, times the assimilation efficiency. The rest of the prey returns to the prey's cell. |
| `deathCause`, `deathStep`, `deathGen` | Set the first time `die()` runs: `old`, `basalConsumption` (out of mass), `attacked`, `health`. Creatures replaced at the end of a generation never die, so these stay `null`. |
| `killedBySpecies` | For `attacked`, the species of the attacker. |

**Update simulation** keeps these values, also when it applies a new map. Save files do not store them, so creatures loaded from a file start with an empty history.
