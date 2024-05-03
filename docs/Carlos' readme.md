


## What is this?

This is a web app (build with TypeScript and React) that runs an evolution and natural selection simulation. This app is inspired on the video "[I programmed some creatures. They Evolved.](https://www.youtube.com/watch?v=N3tRFayqVtk)" (by [David R. Miller](https://github.com/davidrmiller)) whose repo is [here](https://github.com/davidrmiller/biosim4).

The simulation consists of a **map** of 100x100 (by default) squares. Scattered over the map we can find **creatures**. A creature is a colored square that represents an organism in the simulation. Each creature has an int array that is used as its **genome**. Each int in that array is a **gene**. A creature could have a genome of size 4 (meaning it has 4 genes) while other creature in the same simulation could have one of size 16. The genome of a creature gives shape to a simple neural network which dictates how the creature will behave and react.

![image](https://github.com/carlo697/react-biosim/assets/16585568/1841c911-cace-4cef-854c-c56f5ba8498b)

The simulation runs through **generations**. When a generation finishes, the next one will start executing, and so on. In the map there's a semi transparent blue square, that's a **reproduction zone**. If a creature is inside a reproduction zone by the end of a generation, it will **survive**. If a creature survives, it will have offspring, in other words, there will be creatures in the next generation that will share the genome of its parent.

When the simulation starts at generation 0, an **initial population** (by default 1000) of creatures will be spawned, each one with a completely random genome and random position. Their behaviour is gonna be chaotic due to the random genome (and its resulting neural network). But some of the creatures will survive because they'll end up inside the reproduction zone by pure chance, and they'll have children that will populate the next generation. If 30% of the creatures survive (as an example), then **the survival rate** will be 30% for that generation. 

Each time a new generation starts (after the generation 0), the map will be populated again with 1000 creatures, but these creatures will be children of the surviving creatures of the last generation.

This is an example of the creatures at generation 0:

![image](https://github.com/carlo697/react-biosim/assets/16585568/c770ebda-30b9-4b07-bd00-3522d2565a4b)

But here's the catch: everytime a child of a creature is "born", the genome of the parent is copied, but there's a small chance that a random **mutation** will occur (this chance is called the **mutation probability** and it's 5% by default) to one if its genes. There're also mutations that will add or remove genes to the genome (0.5% by default).

Due to these random mutations we are leaving room for natural selection to occur: a child of a creature could be better or worse at reaching the reproduction zone thanks to a random mutation in its genome. So, it could have better probabilities of having children and passing its genome to the next generation.

This results in creatures becoming "smarter" with each passing generation to reach the reproduction zone, and the survival rate will keep increasing:

![image](https://github.com/carlo697/react-biosim/assets/16585568/0c6c9fe4-e6b8-4e3c-8afc-79cf6930cedb)

Example of a creature's neural network and genome after 945 generations:
![image](https://github.com/carlo697/react-biosim/assets/16585568/8827116c-b9b4-476d-8918-29c4a47029cf)


## Features

The app has a full UI to change the settings for the simulation, you can edit things like:
- **The map:** you can set the size and use an editor to add or remove objects like walls and zones.
- **Population:** you can change the initial population and set the probability of mutations.
- **Speed:** use controls to adjust the speed of the simulation or you can pause/resume it. **Note:** set **Immediate steps** to its maximun value to run the simulation at full speed.
- You can watch the population over time in a line chart.
- **Creatures:** you can enable and disable the sensors and actions.
- **Save a JSON:** save a JSON containing the creatures, the settings, and the map of the current simulation.
- **Load a JSON:** load a previously saved JSON to resume that simulation.

# Running

In order to run this project locally, clone the repo and:

1. Install the NPM dependencies:
```
    npm install
```
2. Run the development server:
```
    npm run dev
```

## Built With

- HTML
- CSS
- Tailwind
- TypeScript
- React
- Next.js


## Images
![brave_eVW6W9BO9q](https://github.com/carlo697/react-biosim/assets/16585568/d269be70-aa7c-4649-83b2-ddf3676e7732)
![brave_IOgch5MsFr](https://github.com/carlo697/react-biosim/assets/16585568/e930f46a-fd8f-4845-b946-23ed03c2df04)
![brave_5zRDKlfAeE](https://github.com/carlo697/react-biosim/assets/16585568/e3d12b92-62cd-4c09-a0cc-77b450189658)
![brave_cuteuJ9JfQ](https://github.com/carlo697/react-biosim/assets/16585568/1fe7e0e4-eb6d-4157-8d1e-912a3547d7d1)
![brave_sev9cuvCXq](https://github.com/carlo697/react-biosim/assets/16585568/3f01012e-02c4-49da-9cec-c4c9af1fef14)
![brave_72lWWdV2fE](https://github.com/carlo697/react-biosim/assets/16585568/2edbda70-04a3-4ef3-a823-ff487c3d96a1)
![brave_Y9EpGiBREn](https://github.com/carlo697/react-biosim/assets/16585568/de24e8b0-052b-4c16-ad31-a77110df3b05)

