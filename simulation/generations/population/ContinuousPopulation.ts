import shuffle from "lodash.shuffle";
import WorldGenerations from "../WorldGenerations";
import Creature from "../../creature/Creature";
import PopulationStrategy from "./PopulationStrategy";
import AsexualRandomPopulation from "./AsexualRandomPopulation";
import { GridPosition } from "@/simulation/world/grid/Grid";
import Genome from "@/simulation/creature/brain/Genome";
import CreatureGenus, { Genus } from "@/simulation/creature/CreatureGenus";
import { getRandomItem } from "@/simulation/helpers/helpers";

// Keep everything as is to make next generation a continuation of previous one
// Works with ContinuousSelection
export default class ContinuousPopulation implements PopulationStrategy {
  name = "ContinuousPopulation";
  populate(worldGenerations: WorldGenerations, parents?: Creature[]): void {
      //const creatures: Creature[] = [];

    // First generation
    if (worldGenerations.currentGen === 1) {
      //const arp = new AsexualRandomPopulation();
      //arp.populate (worldGenerations);


      for (let i = 0; i < worldGenerations.initialPopulation; i++) {
        
        // Generate the creature
        let position : GridPosition | null = worldGenerations.grid.getRandomAvailablePosition();
        if (position != null) {
          const genus = getRandomItem(worldGenerations.worldController.simData.constants.POPULATION_DEFAULT_GENUS);
          worldGenerations.newCreature(position, true, new Genome(CreatureGenus.geneArrayForGenus(worldGenerations, genus as Genus, 4)));
        }
        else {
          console.warn("no free position found");
        }
      }





    }
     else
    {
      if (!parents) {
          throw new Error ("generations > 0 should have parents");
      }

      const newParents: Creature[] = parents.filter(creature => creature.stepBirth > 1);
      worldGenerations.updateCreatures(newParents);
    }
  }
}
