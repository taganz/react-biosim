import shuffle from "lodash.shuffle";
import WorldGenerations from "../../world/WorldGenerations";
import Creature from "../Creature";
import PopulationStrategy from "./PopulationStrategy";
import {GridPosition} from "../../world/grid/Grid";


export default class AsexualRandomPopulation implements PopulationStrategy {

  name = "AsexualRandomPopulation";
  populate(worldGenerations: WorldGenerations, parents?: Creature[]): void {
    //const creatures: Creature[] = [];

    // First generation
    if (worldGenerations.currentGen === 0) {
      for (let i = 0; i < worldGenerations.initialPopulation; i++) {
        
        // Generate the creature
        let position : GridPosition | null = worldGenerations.grid.getRandomAvailablePosition();
        if (position != null) {
          worldGenerations.newCreature(position);
        }
        else {
          console.warn("no free position found");
        }
      }

    } else {
    
      if (!parents) {
          throw new Error ("generations > 0 should have parents");
      }

      // Determine how many children per parent are needed
      const childrenPerParent = Math.max(
        Math.ceil(worldGenerations.initialPopulation / parents.length),
        1
      );
      let totalNeededCreatures = worldGenerations.initialPopulation - parents.length;

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
            let position : GridPosition | null = worldGenerations.grid.getRandomAvailablePosition();
            if (position != null) {
              worldGenerations.newCreature(position, parent.massAtBirth, parent.genome);
            }
            else {
              console.warn("no free position found 2");
            }
          }
        }
      }
    }

  }
}
