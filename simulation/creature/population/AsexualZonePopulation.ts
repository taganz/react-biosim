import shuffle from "lodash.shuffle";
import World from "../../world/World";
import {GridPosition} from "../../world/grid/Grid";
import Creature from "../Creature";
import PopulationStrategy from "./PopulationStrategy";
import WorldObject from "@/simulation/world/WorldObject";

// if a SpawnZone object exists, centers population around it, if not, replicate RandomPopulation
export default class AsexualZonePopulation implements PopulationStrategy {
  populate(world: World, parents?: Creature[]): void {
    //const creatures: Creature[] = [];
    let pos : GridPosition | null = null;
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
        pos = world.grid.clamp((obj.x + obj.width/2) * world.size, (obj.y + obj.height/2) * world.size);  // rectangle center
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
          pos = world.grid.getRandomAvailablePosition();
          //var position = world.grid.getRandomAvailablePositionDeepCheck(creatures);
        }
        else {
          pos = pos==null ? [Math.floor(world.size/2), Math.floor(world.size/2)] : pos;
          pos = world.grid.getCenteredAvailablePosition(pos[0], pos[1], halfWidth, halfHeight, world.initialPopulation);
          //var position = world.grid.getCenteredAvailablePositionDeepCheck(creatures, pos[0], pos[1], halfWidth, halfHeight, world.initialPopulation);
        }        
        if (pos != null) {
          world.newCreatureFirstGeneration(pos);
        }
        else {
          console.warn("no position for creature");
        }
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
            let offspringPosition : GridPosition | null;
            if (zonePopulation == false) {
              offspringPosition = world.grid.getRandomAvailablePosition();
            }
            else {
              pos = pos==null ? [Math.floor(world.size/2), Math.floor(world.size/2)] : pos;
              offspringPosition =  world.grid.getCenteredAvailablePosition(pos[0], pos[1], halfWidth, halfHeight, world.initialPopulation);
            }
            if (offspringPosition != null) {
              parent.world.newCreature(offspringPosition, parent.massAtBirth, parent.genome);
            }
            else {
              console.warn("no position for creature 2");
            }
          }
        }
      }
    }

    return creatures;
  }
}
