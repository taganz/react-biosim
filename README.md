# react-biosim

An environment for **evolutionary simulations** in the browser, inspired by David R. Miller's video "[I programmed some creatures. They Evolved.](https://www.youtube.com/watch?v=N3tRFayqVtk)".

Creatures live on a grid and are controlled by small neural networks built from their genes. At the end of each generation, the creatures that meet a goal survive and pass their genes, with occasional mutations, to the next generation. After a few generations, behaviour that looked random becomes purposeful.

![Creatures learning to turn right, generation 5583](docs/turn%20right%20generation%205583.gif)

**Live demo:** <https://biosim.rdalmau.com>

## Quick start

1. Open the **Start** tab and pick a scenario.
2. Watch the fitness curve rise in the **Stats** tab.
3. Click a species in the **Population** tab to see its brain.
4. Change the rules in **Settings** or draw a new map in **Map**, then click **Restart**.

Use the footer to pause the simulation or change its speed. Set **Immediate steps** to 200 to run at full speed.

### Included scenarios

| Scenario | What to watch |
|---|---|
| davidrmiller examples 1, 2 and 4 | The demos from the video, some resumed at a late generation |
| Vertical boxes | Creatures learn to reach the right box |
| Turn right / Turn right generation 5574 | Creatures learn to reach the bottom-left corner of the map |
| Carlos' original | Creatures learn to stay in the centre |
| NW7 generation 13780 | A long run resumed at generation 13780 |

## How the simulation works

- **World.** A square grid (100 × 100 cells by default) with obstacles and areas: spawn, reproduction and health.
- **Creatures.** Each creature fills one cell. Its **genome** is a list of 32-bit genes, and each gene is one weighted connection in its brain.
- **Brain.** **Sensors** (position, age, nearby obstacles, prey…) feed a small neural network that drives **actions** (move, reproduce, attack…).
- **Generations.** A generation lasts a fixed number of steps. When it ends, a **selection method** picks the survivors, for example those standing inside a reproduction area.
- **Inheritance.** A **population strategy** fills the next generation with copies of the survivors' genomes. A copy can mutate: a gene changes, or a gene is added or removed.
- **Experimental.** Optional metabolism (mass and water) and genera (plants, herbivores, carnivores) for predator–prey experiments.

Details: [sensors and actions](docs/reference/sensors-and-actions.md), [population strategies and selection methods](docs/reference/population-and-selection.md) and [all parameters](docs/reference/parameters.md).

## App tabs

| Tab | Use it to |
|---|---|
| Start | Load an included scenario |
| Population | See the top species, a creature's genome and its neural network, live or as a diagram |
| Stats | Plot fitness per generation, check the logger and water |
| Settings | Change world, generations, neural networks, mutations, sensors and actions, then apply with **Update simulation** or **Restart** |
| Map | Draw obstacles and areas, then apply the map to the simulation |
| Files | Save the simulation to a `.sim` file or as JSON, load one back, export images and GIFs |
| About | Credits and links |

## Documentation

- [User guide](docs/user/getting-started.md): how to use every tab
- [Simulation model](docs/model/README.md): world, creatures, brain and genome, generations
- [Reference](docs/README.md#reference): parameters, sensors and actions, population and selection
- [Developer guide](docs/development/README.md): architecture, save format, extending, testing

All pages are listed in [docs/](docs/README.md).

## Development

Requirements: Node.js 20.9 or later (required by Next.js 16).

```bash
npm install
npm run dev     # development server at http://localhost:3000
npm test        # Jest unit tests (__tests__/)
npm run build   # production build
npm run lint
```

Project layout:

| Folder | Contents |
|---|---|
| `app/` | Next.js entry page and layout |
| `components/` | React UI: tabs, footer, canvas and shared inputs |
| `components/simulation/store/` | Jotai atoms that connect the UI to the simulation |
| `simulation/` | The simulation engine, written in plain TypeScript with no React |
| `hooks/` | React hooks |
| `__tests__/` | Unit tests for the engine |
| `public/` | Scenario files loaded by the Start tab |

Built with TypeScript, React, Next.js, Jotai, Tailwind CSS, Chart.js and D3.

## Credits

- Original model and C++ simulator: [David R. Miller, biosim4](https://github.com/davidrmiller/biosim4).
- TypeScript/React port and original UI: [Carlos Peña, react-biosim](https://github.com/carlo697/react-biosim).
- This fork, by [taganz](https://github.com/taganz/react-biosim), adds scenarios, a map editor, alternative selection and population methods, metabolism and genera, logging, GIF export and more.

This is a hobby project under development. See [To do and known issues](docs/To%20do%20and%20known%20issues.md).

License: MIT, see [LICENSE](LICENSE).
