# World

## the world 
- The world is a 2d grid of cells
- Creatures live in the grid. Only one creature per cell
- Grid cell have a water capacity and a water quantity 
- World has a map that contains diferent kind of objects:
    - Spawn zone
    - Reproduction zones
    - Obstacles
- There is a map e
    

## the rain 
- At the beggining of each generation WordController executes rain over the grid
- The rain distributes water in the cells with a function of x, y
- TODO allow rain function configuration
    - at present uniform, sinsin in the code


## execution is controled by WorldController 
- This class controls the execution
    - Step and generation loop
    - Pause & resume
    - Extintion detection and restart
    - Rain


## map editor
- Object types
    - Spawn zone: only one should be created
    - Reproduction zones
    - Obstacles
    - Health zones have no current use
- At start map editor loads cached map
- "use map" to load current map in the simulation
- Known issue: last object in the list will have color black. Better put an obstacle at the last position




