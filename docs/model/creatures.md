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
- The **genus** is worked out from the new genome, so a mutation can turn a herbivore into a plant or the other way round.
- **Birth mass** depends on the genus: `MASS_AT_BIRTH_PLANT` for plants and for `unknown`, `MASS_AT_BIRTH_ATTACK_PLANT` for herbivores, `MASS_AT_BIRTH_ATTACK_ANIMAL` for carnivores. With metabolism on, generation-1 creatures take that mass from the cloud's water.
- **Health** starts at 100.

## One step

At every step, each living creature runs `computeStep()`, in this order:

1. **Age.** In continuous runs, if its age is above **Maximum age**, it dies of old age. In generational runs the limit is *Steps per generation* + 1, so it never applies: creatures are replaced first.
2. **Basal metabolism.** It spends `MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE × number of genes`, so bigger genomes cost more.
3. **Think and act.** It reads its sensors, runs its network and executes the actions (see [Brain and genome](brain.md)). Movement actions only add to an *urge to move*. Photosynthesis, Reproduction and the attacks happen straight away.
4. **Action cost.** It spends `MASS_COST_PER_EXECUTE_ACTION × number of actions enabled in the simulation`. Every creature pays the same, whatever its own brain uses.
5. **Move.** The urge to move is resolved (see [Movement](#movement)).
6. **Distance index.** The `distanceCovered` counter is updated (see [Distance index](#distance-index)).

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
- With metabolism on, every attempt costs `MOVE_COST_PER_MASS_TRY × birth mass`. A successful move costs another `MOVE_COST_PER_MASS_DO × birth mass`. A creature that is too light cannot move.

A strong urge (an action output close to 1) makes movement almost certain. A weak one makes it occasional, which is where much of the randomness in early generations comes from.

## Distance index

`distanceCovered` is the fitness used by **Greatest Distance** selection. It does not count every cell travelled. It rewards **long straight runs**:

- When the creature keeps moving in the same direction, a run counter grows (up to 120). Once the run is longer than 35 steps, each further step adds 1 to `distanceCovered`.
- Changing direction resets the run counter.
- After 100 steps without moving, each further still step takes 1 from `distanceCovered` (down to 0).

The 35, 120 and 100 thresholds are constants in `Creature.ts` and are not in the settings.

## Mass and metabolism

When **metabolism** is off (the default in the classic scenarios), mass never changes and none of this section applies.

When it is on, mass is the creature's energy:

| Gains mass | Loses mass |
|---|---|
| **Photosynthesis:** takes `MASS_WATER_TO_MASS_PER_STEP × action output` of water from its cell, or less if it would go over its maximum mass. | Basal metabolism and action cost, every step |
| **Attack:** a successful attack takes the prey's mass, up to the maximum mass. The rest returns to the prey's cell when it dies. | Moving, attacking, reproducing (see [parameters](../reference/parameters.md#metabolism-constants-worldcontrollerdata)) |

- Mass is capped at `MASS_MAX_MULTIPLE_MASS_AT_BIRT × birth mass`.
- A creature with no mass left dies.
- All mass is water, so it is conserved (see [World → Water](world.md#water)). A child's birth mass comes from its parent; in generational runs, the mass of each new generation comes from the cloud.

### Reproduction

The **Reproduction** action creates a child during the generation, in one of the 8 cells around the parent:

- The parent needs more than `REPRODUCTION_MULTIPLE_MASS_AT_BIRTH × birth mass`. With metabolism on, it also needs `REPRODUCTION_COST_PER_MASS_DO × birth mass` on top. Without that mass the action does nothing: it is not an attempt and costs nothing.
- The child goes to a free cell, chosen at random. If none is free, a herbivore or carnivore parent eats a neighbour it can eat (the same rules as an [attack](#attack), in any of the 8 cells) and the child takes its cell.
- A successful reproduction costs `REPRODUCTION_COST_PER_MASS_DO × birth mass`, plus the birth mass handed to the child.
- An attempt with no free cell and nothing to eat costs `REPRODUCTION_COST_PER_MASS_TRY × birth mass`.

> **Known issue.** With metabolism off, mass never changes, so it can never exceed `REPRODUCTION_MULTIPLE_MASS_AT_BIRTH` (3) × birth mass. The Reproduction action therefore never succeeds unless metabolism is on.

### Attack

**AttackPlant** and **AttackAnimal** fire when their output is above `ACTION_REPRODUCTION_OFFSET` (0.6) and one of the 4 neighbouring cells (N, E, S, W) holds a creature the attacker can eat: alive, of a **different genus**, and with at most `1 / ATTACK_MIN_PREY_MASS_FACTOR` (half) of the attacker's mass. If several can be eaten, one is chosen at random; neighbours that cannot be eaten are skipped, and with none the action does nothing. Plants never eat. The attack:

1. costs `ATTACK_COST_PER_MASS_TRY`. There is no minimum mass to attack: a creature lighter than that cost dies trying;
2. kills the target, and the attacker gains the target's mass, up to its maximum mass.

The genus of the target is otherwise not checked: a herbivore can kill a carnivore if it is heavy enough.

## Genus

| Genus | Common name | Has a gene connected to | Hunts |
|---|---|---|---|
| `attack_animal` | carnivore | AttackAnimal | herbivores |
| `attack_plant` | herbivore | AttackPlant (and not AttackAnimal) | plants |
| `plant` | plant | Photosynthesis (and no attack) | — |
| `unknown` | — | none of these | — |

Only actions decide the genus. A creature whose genome connects to Photosynthesis *and* AttackPlant is a herbivore. When the scenario uses `trophicLevel` colouring, plants are drawn green, herbivores blue and carnivores red, with shades that depend on the genome.

## Species

Two creatures belong to the same **species** when their genomes are identical, gene for gene ([Species.ts](../../simulation/creature/Species.ts)). Species are not stored by the engine. The Population tab groups the creatures by genome at the start of every generation. A species' colour is computed from the values of its genes, so close relatives often have similar colours.

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
| `attackCount`, `killCount` | Attack actions executed and prey killed. |
| `waterFromPhotosynthesis` | Total water taken from its cell by Photosynthesis. |
| `waterFromPrey` | Total mass taken from the prey it killed. It only counts what fitted below its maximum mass: the rest of the prey returns to the prey's cell. |
| `deathCause`, `deathStep`, `deathGen` | Set the first time `die()` runs: `old`, `basalConsumption` or `actionsExecutionConsumption` (out of mass), `attacked`, `health`. Creatures replaced at the end of a generation never die, so these stay `null`. |
| `killedBySpecies` | For `attacked`, the species of the attacker. |

**Update simulation** and **Use Map** keep these values. Save files do not store them, so creatures loaded from a file start with an empty history.
