# Map editor

The **Map** tab is where you draw the world: obstacles and areas.

![Map tab](images/tab_map.png)

## Object types

Choose a type in **Add object** to create a 20% × 20% object in the top-left corner.

| Object | Effect |
|---|---|
| Rectangle, Ellipse | **Obstacle.** Creatures cannot enter it. The touch sensors detect it. |
| Rectangle Reproduction, Ellipse Reproduction | **Reproduction area** (blue). With the *Inside Reproduction Area* selection method, creatures standing here when the generation ends survive. With any other selection method, or in a continuous run, it has no effect, and the simulation canvas does not draw it (the map editor still does). |
| Rectangle Spawn | **Spawn area** (yellow). With the *Asexual Zone* population strategy, new creatures are placed here. Use only one: if there are several, only the one furthest back is used. |
| Rectangle Health, Ellipse Health | **Health area.** Drawn green for a positive **Health** value and red for a negative one. **It currently has no effect:** the code that applies it is disabled (see [World](../model/world.md#objects-and-areas)). |

## Editing

- **Select** an object by clicking it on the canvas. A white outline marks it, and its properties appear on the right. Where objects overlap, the click selects the one on top; click again on the same spot to select the one below it, and so on. Clicking an empty spot clears the selection.
- **Move** an object by dragging it on the canvas. Dragging an object that is not selected selects it first.
- **Resize** the selected object by dragging the handles at its corners and edges.
- **Fine-tune** it with **X**, **Y**, **Width** and **Height** on the right. Values are fractions of the world size: 0 is the top or left edge and 1 is the bottom or right edge. Positions snap to whole cells.
- **Clone** duplicates the selected object. **Delete**, or the Delete key, removes it.
- **To front** and **To back** change the drawing order: the object is drawn on top of, or below, all the others. New objects are drawn on top. The order also decides which spawn area is used: only the one furthest back counts.
- The **fullscreen** button (top right) gives you a bigger canvas.

## Applying the map

- **Use Map** sends the map to the running simulation. The creatures and the generation count are kept, so the population has to adapt to the new world. Creatures standing where a new obstacle is placed are removed.
- **Reset Designer** throws away your edits and loads the map of the running simulation into the designer.

The designer remembers your map in the browser's local storage, even after you close the page. It does **not** follow the scenario that is running.

> **The designer can start empty.** The first time you open it, or after loading a new scenario, it may show an empty map or an old one. Click **Reset Designer** to load the current map before you edit it.

To keep a map, save the whole simulation from the [Files](files.md) tab. The map is part of the saved file.
