# World

Source: [simulation/world/](../../simulation/world/) and [simulation/water/](../../simulation/water/).

## Grid

The world is a square grid of **World size × World size** cells ([Grid.ts](../../simulation/world/grid/Grid.ts)). Coordinates start at the top-left corner: `x` grows to the right and `y` grows downwards.

Each cell holds:

| Field | Meaning |
|---|---|
| `creature` | The creature in the cell, if any. **A cell holds at most one creature.** |
| `objects` | The map objects that cover the cell. |
| `isSolid` | `true` if an obstacle covers the cell. Creatures cannot enter it. |
| `water`, `waterCapacity` | Water stored in the cell, and the most it can hold. |

A cell is **empty** when it has no creature and is not solid. New creatures are placed only in empty cells. The population can never exceed the number of cells.

Distances between cells (used by the prey sensors) are measured in steps on a chessboard: `max(|dx|, |dy|)`. A diagonal step counts as 1.

## Objects and areas

The map is a list of objects ([WorldObject.ts](../../simulation/world/objects/WorldObject.ts)). Positions and sizes are fractions of the world size, so a map scales with the world. When the grid is built, each object is turned into the set of cells it covers.

| Object | Area type | Solid | Effect |
|---|---|---|---|
| Rectangle, Ellipse | — | yes | Obstacle. Blocks movement. The touch sensors detect it. |
| Reproduction area (rectangle or ellipse) | 0 | no | Used by the *Inside Reproduction Area* selection method. |
| Health area (rectangle or ellipse) | 1 | no | Meant to change creature health by its `health` value at every step. **This is currently disabled:** the call is commented out in `WorldGenerations.step()`, so health areas have no effect. |
| Spawn area (rectangle) | 2 | no | Used by the *Asexual Zone* population strategy. Only the first spawn area counts. |

The world's edges block movement like an obstacle, and the touch sensors read them as solid.

## Water

Water only matters when **metabolism** is enabled. It is the raw material of mass: plants turn water into mass with **Photosynthesis**, and the mass flows on to herbivores and carnivores when they eat.

The total amount of water is fixed and is split between three stores ([WorldWater.ts](../../simulation/water/WorldWater.ts)):

```
             rain, first rain
   cloud  ─────────────────────▶  cells
     ▲  ◀───────────────────────    │
     │        evaporation           │ photosynthesis
     │                              ▼
     └──────────────────────────  creatures
         spent mass (dissipation)    │
                                     │ death: mass back to the cell,
                                     ▼ or to the cloud if the cell is full
```

- **Total water** is `World size² × Total water (per cell)`. It all starts in the cloud.
- **First rain:** at the start of a run, each cell receives **Initial water per cell**, as far as the cloud allows.
- **Creatures of generation 1** take their birth mass from the cloud.
- **Photosynthesis** moves water from the creature's cell into the creature.
- **Spending mass** (moving, metabolism, reproducing…) sends that water back to the cloud.
- **Death** returns the creature's remaining mass to its cell, up to the cell's capacity. The rest goes to the cloud.
- **Rain**, at the end of every generation, adds water to every cell using the **Rain type** pattern, with **Rain max per cell** as the maximum. It only rains if the cloud can cover the maximum everywhere.
  - `rainTypeUniform`: the same amount everywhere.
  - `rainTypeUniformNE`: the full amount in the top-right quarter and half elsewhere.
  - `rainTypeSinSin`: most in the centre, falling to zero at the edges.
- **Evaporation**, at the end of every generation and before the rain, takes up to **Evaporation** units from each cell back to the cloud. (The call is hidden inside the end-of-generation logging function, `logEndGeneration`.)
- With the classic (non-continuous) selection methods, all water is **reset** at the end of every generation, followed by a new first rain. Only continuous runs carry water over between generations.

The **Water** box in *Stats → Under development* shows the three stores. Their sum should stay constant.
