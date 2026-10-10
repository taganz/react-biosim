# react-biosim documentation

## User guide

How to use the app.

1. [Getting started](user/getting-started.md): the screen, loading a scenario, speed controls
2. [Population and brains](user/population-and-brains.md): species, selecting creatures, reading neural networks
3. [Settings and stats](user/settings-and-stats.md): changing the rules, applying changes, reading the fitness chart
4. [Map editor](user/map-editor.md): obstacles and areas
5. [Files](user/files.md): save, load, PNG and GIF export
6. [Scenarios](user/scenarios.md): what each included scenario shows

## Simulation model

How the simulation works: the rules the engine follows. Start with the [overview](model/README.md).

1. [World](model/world.md): grid, obstacles and areas, water and rain
2. [Creatures](model/creatures.md): one step of a creature, movement, mass and metabolism, genus, death
3. [Brain and genome](model/brain.md): from genes to network, how it computes, mutation
4. [Generations](model/generations.md): the loop, selection, repopulation, extinction

## Reference

Exact lists of everything you can configure, taken from the code.

- [Parameters](reference/parameters.md): every setting, its allowed values and its startup value
- [Sensors, actions and genes](reference/sensors-and-actions.md): the brain's inputs and outputs, genera and gene encoding
- [Population strategies and selection methods](reference/population-and-selection.md): how each generation is created and how survivors are chosen

## Other

- [To do and known issues](To%20do%20and%20known%20issues.md) (old list, to be revised)
