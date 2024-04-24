import shuffle from "lodash.shuffle";
import WorldGenerations from "../WorldGenerations";
import {GridPosition} from "../../world/grid/Grid";
import Creature from "../../creature/Creature";
import PopulationStrategy from "./PopulationStrategy";
import WorldObject from "@/simulation/world/objects/WorldObject";

// if a SpawnZone object exists, centers population around it, if not, replicate RandomPopulation
export default class AsexualZonePopulation implements PopulationStrategy {
  name = "AsexualZonePopulation";
  populate(generations: WorldGenerations, parents?: Creature[]): void {
    //const creatures: Creature[] = [];
    let pos : GridPosition = [Math.floor(generations.grid.size/2), Math.floor(generations.grid.size/2)];
    let zonePopulation : boolean = false;
    let halfWidth : number = 0;
    let halfHeight : number = 0;
    let offspringPosition : GridPosition | null;
     
    // if a spawn zone exists will use zone population
    for (
      let objectIndex = 0;
      objectIndex < generations.grid.objects.length;
      objectIndex++
      ) {
      const obj = generations.grid.objects[objectIndex];

      // Is it a spawn area?
      if (obj.areaType === 2) {
        zonePopulation = true;
        pos = generations.grid.clamp((obj.x + obj.width/2) * generations.grid.size, (obj.y + obj.height/2) * generations.grid.size);  // rectangle center
        halfWidth = obj.width/2 * generations.grid.size;
        halfHeight = obj.height/2 * generations.grid.size;
        break;
      }
    }
    
    // First generation
    if (generations.isFirstGeneration) {
      for (let i = 0; i < generations.initialPopulation; i++) {

        // Generate the creature
        if (zonePopulation == false) {
          offspringPosition = generations.grid.getRandomAvailablePosition();
        }
        else {
          offspringPosition = generations.grid.getCenteredAvailablePosition(pos[0], pos[1], halfWidth, halfHeight, generations.initialPopulation);
        }        
        if (offspringPosition != null) {
          generations.newCreature(offspringPosition);
        }
        else {
          console.warn("no position for creature");
        }
      }
        
    } else if (parents) {
      // Determine how many children per parent are needed
      const childrenPerParent = Math.max(
        Math.ceil(generations.initialPopulation / parents.length),
        1
      );
      let totalNeededCreatures = generations.initialPopulation - parents.length;

      
      // Add extra creatures to achieve the target population, but
      // we want all survivors to have at least one children
      let shuffledParents = shuffle(parents);
      
      //===================================================
      //TODO RD 23/4/25 - PROVES LIMITAR A INITIAL POPULATION
      if (totalNeededCreatures < 0 ) {
        for (let parentIdx = 0; parentIdx < generations.initialPopulation; parentIdx++) {
          const parent = shuffledParents[parentIdx];
          let position : GridPosition | null = generations.grid.getRandomAvailablePosition();
          if (position != null) {
            generations.newCreature(position, parent.massAtBirth, parent.brain.genome);
          }
          else {
            console.warn("no free position found 2");
          }
        }
        return;
      }
      //===================================================



      for (let parentIdx = 0; parentIdx < shuffledParents.length; parentIdx++) {
        const parent = shuffledParents[parentIdx];

        for (let childIdx = 0; childIdx < childrenPerParent; childIdx++) {
          if (childIdx === 0 || totalNeededCreatures > 0) {
            if (childIdx > 0) {
              totalNeededCreatures--;
            }

            // Produce a child
            if (zonePopulation == false) {
              offspringPosition = generations.grid.getRandomAvailablePosition();
            }
            else {
              pos = pos==null ? [Math.floor(generations.grid.size/2), Math.floor(generations.grid.size/2)] : pos;
              offspringPosition =  generations.grid.getCenteredAvailablePosition(pos[0], pos[1], halfWidth, halfHeight, generations.initialPopulation);
            }
            if (offspringPosition != null) {
              generations.newCreature(offspringPosition, parent.massAtBirth, parent.brain.genome);
            }
            else {
              console.warn("no position for creature 2");
            }
          }
        }
      }
    }

  }
}
