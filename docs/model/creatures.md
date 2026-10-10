# Creatures

Source: [simulation/creature/](../../simulation/creature/), mainly [Creature.ts](../../simulation/creature/Creature.ts).

A creature has:

- a **position** (one cell);
- a **genome** and the **brain** built from it (see [Brain and genome](brain.md));
- a **genus** derived from the genome;
- **mass** (only changes with metabolism) and **health**;
- an **id**, its birth step and its age, plus counters used by the selection methods (`distanceCovered`).

## Birth

A creature is created by the population strategy, or by another creature through the **Reproduction** action.

- **Generation 1:** usually a random genome of **Initial genome size** genes. Some strategies build genomes for a given genus instead.
- **Later generations:** a copy of the parent's genome, which may mutate (see [Mutation](brain.md#mutation)).
- The **genus** is worked out from the new genome, so a mutation can turn a herbivore into a plant or the other way round.
- **Birth mass** depends on the genus: `MASS_AT_BIRTH_PLANT` for plants and for `unknown`, `MASS_AT_BIRTH_ATTACK_PLANT` for herbivores, `MASS_AT_BIRTH_ATTACK_ANIMAL` for carnivores. With metabolism on, generation-1 creatures take that mass from the cloud's water.
- **Health** starts at 100.

## One step

At every step, each living creature runs `computeStep()`, in this order:

1. **Age.** If its age is above *Steps per generation* + 1, it dies of old age. This only matters in continuous runs, where creatures live across generations.
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
| **Photosynthesis:** takes `MASS_WATER_TO_MASS_PER_STEP × action output` of water from its cell. | Basal metabolism and action cost, every step |
| **Attack:** a successful attack adds the prey's mass. | Moving, attacking, reproducing (see [parameters](../reference/parameters.md#metabolism-constants-worldcontrollerdata)) |

- Mass is capped at `MASS_MAX_MULTIPLE_MASS_AT_BIRT × birth mass`.
- A creature with no mass left dies.
- All mass is water, so it is conserved (see [World → Water](world.md#water)).

### Reproduction

The **Reproduction** action creates a child during the generation, in a free cell next to the parent:

- The parent needs more than `REPRODUCTION_MULTIPLE_MASS_AT_BIRTH × birth mass`. With metabolism on, it also needs `REPRODUCTION_COST_PER_MASS_DO × birth mass` on top.
- A successful reproduction costs `REPRODUCTION_COST_PER_MASS_DO × birth mass`, plus the birth mass handed to the child.
- A failed attempt, because the parent is too light or has no free neighbouring cell, costs `REPRODUCTION_COST_PER_MASS_TRY × birth mass`.

> **Known issue.** With metabolism off, mass never changes, so it can never exceed `REPRODUCTION_MULTIPLE_MASS_AT_BIRTH` (3) × birth mass. The Reproduction action therefore never succeeds unless metabolism is on.

### Attack

**AttackPlant** and **AttackAnimal** fire when their output is above `ACTION_REPRODUCTION_OFFSET` (0.6) and a creature occupies one of the 4 neighbouring cells. The attack:

1. needs, with metabolism on, more than `ATTACK_MULTIPLE_MASS_AT_BIRTH × birth mass` (plus `ATTACK_COST_PER_MASS_DO`);
2. costs `ATTACK_COST_PER_MASS_TRY`;
3. fails if the target has the **same genus** as the attacker;
4. fails unless the attacker weighs at least `ATTACK_MIN_PREY_MASS_FACTOR` (2) times the target's mass;
5. otherwise kills the target, and the attacker gains the target's mass.

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
- it gets too old (continuous runs only).

When it dies, its remaining mass goes back to its cell as water, and it is removed from the grid. In the classic model creatures do not die during a generation: they simply fail to be selected at the end.
