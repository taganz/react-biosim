# The simulation model

These pages explain how the simulation works: the rules the engine follows, not how to use the app. For the exact list of settings, sensors and actions, see the [reference](../README.md#reference).

1. [World](world.md): the grid, obstacles and areas, water and rain
2. [Creatures](creatures.md): what a creature does in a step, movement, mass and metabolism, genus, death
3. [Brain and genome](brain.md): how genes become a neural network, how it computes, and how genomes mutate
4. [Generations](generations.md): the simulation loop, selection, repopulation and extinction

## In one paragraph

The world is a square grid. Each cell holds at most one creature. Every creature carries a **genome**: a list of 32-bit genes. Each gene is a weighted connection in a small neural network that links **sensors** (where am I, what is around me) to **actions** (move, reproduce, attack). A **generation** is a fixed number of steps. At each step every creature reads its sensors, runs its network and acts. When the generation ends, a **selection method** picks the survivors. A **population strategy** then fills the next generation with copies of their genomes, and some copies mutate. Genomes that produce useful behaviour spread through the population.

This is the model of David R. Miller's [biosim4](https://github.com/davidrmiller/biosim4), ported to TypeScript. This fork adds alternative selection and population rules, and an experimental layer of mass, water and genera (plants, herbivores, carnivores).
