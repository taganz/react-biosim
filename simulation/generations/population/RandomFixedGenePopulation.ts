import shuffle from "lodash.shuffle";
import WorldGenerations from "../WorldGenerations";
import {GridPosition} from "../../world/grid/Grid";
import Creature from "../../creature/Creature";
import PopulationStrategy from "./PopulationStrategy";
import WorldObject from "@/simulation/world/objects/WorldObject";
import * as constants from "@/simulation/simulationConstants";
import Genome from "../../creature/brain/Genome"

const fixedGene = Genome.encodeGeneData([ 1, 3, 1, 4, 49152 ]);  // weight = 2

// if a SpawnZone object exists, centers population around it, if not, replicate RandomPopulation
export default class RandomFixedGenePopulation implements PopulationStrategy {
  name = "RandomFixedGenePopulation";
  populate(worldGenerations: WorldGenerations, parents?: Creature[]): void {
      //const creatures: Creature[] = [];

    // First generation
    if (worldGenerations.currentGen === 0) {
      for (let i = 0; i < worldGenerations.initialPopulation; i++) {
        
        // Generate the creature
        let position : GridPosition | null = worldGenerations.grid.getRandomAvailablePosition();
        if (position != null) {
          worldGenerations.newCreature(position, constants.MASS_AT_BIRTH_GENERATION_0, new Genome([fixedGene]) );
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
              worldGenerations.newCreature(position, parent.mass.massAtBirth, parent.brain.genome);
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
