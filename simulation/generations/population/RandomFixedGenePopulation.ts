import shuffle from "lodash.shuffle";
import WorldGenerations from "../WorldGenerations";
import {GridPosition} from "../../world/grid/Grid";
import Creature from "../../creature/Creature";
import PopulationStrategy from "./PopulationStrategy";
import Genome from "../../creature/brain/Genome"
import CreatureGenus from "@/simulation/creature/CreatureGenus";
import { selectGenusBasedOnProbability } from "./selectGenusBasedOnProbability"; 

// if a SpawnZone object exists, centers population around it, if not, replicate RandomPopulation
export default class RandomFixedGenePopulation implements PopulationStrategy {
  name = "RandomFixedGenePopulation";
  populate(worldGenerations: WorldGenerations, parents?: Creature[]): void {

    if (worldGenerations.currentGen === 1) {
      // First generation: fill up to initial population with creatures from available genus list, with a given probabilty, in a random free cell
      for (let i = 0; i < worldGenerations.initialPopulation; i++) {
        let position : GridPosition | null = worldGenerations.grid.getRandomAvailablePosition();
        if (position != null) {
          const genus = selectGenusBasedOnProbability(worldGenerations.worldController.simData.constants.POPULATION_DEFAULT_GENUS);
          const genes = CreatureGenus.geneArrayForGenus(worldGenerations, genus, worldGenerations.initialGenomeSize);
          worldGenerations.newCreature(position, true, new Genome(genes) );
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
            worldGenerations.newCreature(position, false, parent.brain.genome);
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
              worldGenerations.newCreature(position, false, parent.brain.genome);
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
