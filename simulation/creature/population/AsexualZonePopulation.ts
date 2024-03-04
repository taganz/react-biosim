import shuffle from "lodash.shuffle";
import World from "../../world/World";
import Creature from "../Creature";
import PopulationStrategy from "./PopulationStrategy";
import WorldObject from "@/simulation/world/WorldObject";

// if a SpawnZone object exists, centers population around it, if not, replicate RandomPopulation
export default class AsexualZonePopulation implements PopulationStrategy {
  populate(world: World, parents?: Creature[]): Creature[] {
    const creatures: Creature[] = [];
    let pos : [number, number] = [0.5, 0.5];
    let zonePopulation : boolean = false;
    let halfWidth : number = 0;
    let halfHeight : number = 0;
     
    // if a spawn zone exists will use zone population
    for (
      let objectIndex = 0;
      objectIndex < world.objects.length;
      objectIndex++
      ) {
      const obj = world.objects[objectIndex];

      // Is it a spawn area?
      if (obj.areaType === 2) {
        zonePopulation = true;
        pos = world.clampWorld((obj.x + obj.width/2) * world.size, (obj.y + obj.height/2) * world.size);  // rectangle center
        halfWidth = obj.width/2 * world.size;
        halfHeight = obj.height/2 * world.size;
        break;
      }
    }
    
    
    // First generation
    if (world.currentGen === 0) {
      for (let i = 0; i < world.initialPopulation; i++) {
        // Generate the creature
        if (zonePopulation == false) {
          var position = world.getRandomAvailablePositionDeepCheck(creatures);
        }
        else {
          var position = world.getCenteredAvailablePositionDeepCheck(creatures, pos[0], pos[1], halfWidth, halfHeight);
        }
        
        const creature = new Creature(world, position);
        creatures.push(creature);
      }
    } else if (parents) {
      // Determine how many children per parent are needed
      const childrenPerParent = Math.max(
        Math.ceil(world.initialPopulation / parents.length),
        1
      );
      let totalNeededCreatures = world.initialPopulation - parents.length;

      // Add extra creatures to achieve the target population, but
      // we want all survivors to have at least one children
      let shuffledParents = shuffle(parents);
      for (let parentIdx = 0; parentIdx < shuffledParents.length; parentIdx++) {
        const parent = shuffledParents[parentIdx];
        for (let childIdx = 0; childIdx < childrenPerParent; childIdx++) {
          if (childIdx === 0 || totalNeededCreatures > 0) {
            if (childIdx > 0) {
              totalNeededCreatures--;
            }

            // Produce a child
            const creature = parent.reproduce();
            if (zonePopulation == false) {
              creature.position = world.getRandomAvailablePositionDeepCheck(creatures);
            }
            else {
              creature.position =  world.getCenteredAvailablePositionDeepCheck(creatures, pos[0], pos[1], halfWidth, halfHeight);
            }
            creatures.push(creature);
          }
        }
      }
    }

    return creatures;
  }
}
