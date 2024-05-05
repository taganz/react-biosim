# Running a simulation

- Select a scenario template in **Start** panel
- Setup the environment selecting initial settings in **Settings** panel. You can also create a new map in the **Map** panel
- Run de simulation pressing **Restart** button. Adjust simulation speed
- Visualize creature brain evolution at **Population** panel
- Visualize fitness evolution in tab **Stats**
- Share your results saving current simulation or generating a gif in the **Save** panel. 
- Rerun a saved simulation in **Load** panel.
- A csv log can be generated from **Start** panel (work in progress)


# Settings

## WorldController
- Simulation code is assigned by system
- Phenotype mode is assigned by default scenario
    - trophicLevel: color is related to genus
    - genome: color is related to specie


## Sim options
- Metabolism status is assigned by default scenario
- Selection method defines how survivors will be selected at the end of the generation
    - InsideReproductionArea
    - GreatestDistance
    - Reproduction: all survivors will be selected
    - Continuous
- Population strategy defines how creatures will be respawn at the beginning of the generation, based from survivors from previous generation
    - Asexual Random
    - Asexual Zone
    - Random Fixed Gene
    - Continuous

## Neuronal Networks

## Mutations

## Sensors

## Actions


# Map editor
- Create a map in the **Map** panel 
- Object types
    - Spawn zone: only one should be created
    - Reproduction zones
    - Obstacles
    - Health zones have no current use
- At start map editor loads cached map
- Press **Use Map** button to change the simulation
- Known issue: last object in the list will have color black. Better put an obstacle at the last position
