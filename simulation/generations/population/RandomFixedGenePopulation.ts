import shuffle from "lodash.shuffle";
import WorldGenerations from "../WorldGenerations";
import {GridPosition} from "../../world/grid/Grid";
import Creature from "../../creature/Creature";
import PopulationStrategy from "./PopulationStrategy";
import Genome from "../../creature/brain/Genome"
import { POPULATION_DEFAULT_SPECIES } from "@/simulation/simulationConstants";
const fixedGene = Genome.encodeGeneData([ 1, 3, 1, 4, 49152 ]);  // weight = 2

// if a SpawnZone object exists, centers population around it, if not, replicate RandomPopulation
export default class RandomFixedGenePopulation implements PopulationStrategy {
  name = "RandomFixedGenePopulation";
  populate(worldGenerations: WorldGenerations, parents?: Creature[]): void {
      //const creatures: Creature[] = [];

    // First generation
    if (worldGenerations.currentGen === 1) {
      for (let i = 0; i < worldGenerations.initialPopulation; i++) {
        
        // Generate the creature
        let position : GridPosition | null = worldGenerations.grid.getRandomAvailablePosition();
        if (position != null) {
          // select a random species from constant files
          const species = POPULATION_DEFAULT_SPECIES;
          const randomDefaultSpecie = species[Math.floor(Math.random() * species.length)];
          worldGenerations.newCreature(position, new Genome(randomDefaultSpecie.genome) );
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
      
      //===================================================
      //TODO RD 23/4/25 - PROVES LIMITAR A INITIAL POPULATION
      if (totalNeededCreatures < 0 ) {
        for (let parentIdx = 0; parentIdx < worldGenerations.initialPopulation; parentIdx++) {
          const parent = shuffledParents[parentIdx];
          let position : GridPosition | null = worldGenerations.grid.getRandomAvailablePosition();
          if (position != null) {
            worldGenerations.newCreature(position, parent.brain.genome);
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
            let position : GridPosition | null = worldGenerations.grid.getRandomAvailablePosition();
            if (position != null) {
              worldGenerations.newCreature(position, parent.brain.genome);
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
