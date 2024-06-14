import shuffle from "lodash.shuffle";
import WorldGenerations from "../WorldGenerations";
import {GridPosition} from "../../world/grid/Grid";
import Creature from "../../creature/Creature";
import PopulationStrategy from "./PopulationStrategy";
import Genome from "../../creature/brain/Genome"
import CreatureGenus from "@/simulation/creature/CreatureGenus";
import { selectGenusBasedOnProbability } from "./selectGenusBasedOnProbability"; 
import { addCreaturesFromGenus, addCreaturesFromParent } from "./addCreatures";

// if a SpawnZone object exists, centers population around it, if not, replicate RandomPopulation
export default class RandomFixedGenePopulation implements PopulationStrategy {
  
  name = "RandomFixedGenePopulation";

  populate(worldGenerations: WorldGenerations, parents?: Creature[]): void {

    if (worldGenerations.currentGen === 1) {
      // First generation: fill up to initial population with creatures from available genus list, with a given probabilty, in a random free cell
      for (let i = 0; i < worldGenerations.initialPopulation; i++) {
        
        //TODO fer servir addCreatureForGenus per omplir fins a probabilitat * initialPopulaiton
        //la resta posar-ho amb random genes
        //lloc en zone o random zone segons si hi ha zone o no

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

      // Add extra creatures to achieve the target population, but
      // we want all survivors to have at least one children
      
      const neededChildrenPerParent = 
        Math.max(Math.ceil(worldGenerations.initialPopulation / parents.length),1);
    
      for (let parentIdx = 0; parentIdx < parents.length; parentIdx++) {
        const parent = parents[parentIdx];
        addCreaturesFromParent(worldGenerations, parent, neededChildrenPerParent);
       }
    }
  }
}