# Creature

- Creatures have a brain
- Creatures have sensors
- Creatures have actions
- Creatures have a species and a genus 
- Creatures have a phenotyphe
- Creatures have mass and energy interactions (WORK IN PROGRESS)
- Creature's color can depend on species or genus depending on selected scenario



## species and genus

- Species depends on genome
- Genus depends on some key actions included on the genome (plant, move, attack, attack_move)
- Creatures can have mass
- Creature's color can depend on species or genus depending on selected scenario
    - If species: color depend on genome numeric value
    - If genus: color are based on green for plants, yellow for move, blue for attack and red for attack_move



## energy (water, mass)

- If scenario is "metabolism enabled" creatures need energy to execute actions
- Creatures get energy from water in the cell through photosynthesis action
- Water is transformed into creature mass
- Creatures give mass to offspring at birth
- Creatures will die if mass is zero

## actions

### movement

### photosynthesis
- Creatures get energy from water in the cell through photosynthesis action
- Water is transformed in creature mass

### reproduction
- Creatures give mass to offspring at birth

### attack
- A creature with attack action can kill a neighbour if some conditions are met
    - Sensor touch is activated
    - Prey is from different specie
    - Its mass is greater than prey mass
- Predator gets prey mass
- Prey dies

### 