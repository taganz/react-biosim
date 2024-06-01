import shuffle from "lodash.shuffle";
import WorldGenerations from "../WorldGenerations";
import {GridPosition} from "../../world/grid/Grid";
import Creature from "../../creature/Creature";
import PopulationStrategy from "./PopulationStrategy";
import Genome from "../../creature/brain/Genome"
import CreatureGenus, { Genus } from "@/simulation/creature/CreatureGenus";
import { selectGenusBasedOnProbability } from "./selectGenusBasedOnProbability"; 

/* 
  WORK

// populate with a given distribution of plants and herbivores

*/
const HERBIVORES_PROPORTION = 0.2;

// if a SpawnZone object exists, centers population around it, if not, replicate RandomPopulation
export default class PlantHerbivorePopulation implements PopulationStrategy {
  name = "PlantHerbivorePopulation";

  private addCreaturesForGenus(worldGenerations: WorldGenerations, genus: Genus, total: number) {
    for (let i = 0; i < total; i++) {
      let position : GridPosition | null = worldGenerations.grid.getRandomAvailablePosition();
      if (position != null) {
          var genes = CreatureGenus.geneArrayForGenus(worldGenerations, genus, worldGenerations.initialGenomeSize);
          worldGenerations.newCreature(position, true, new Genome(genes) );
      }
      else {
        console.warn("no free position found");
      }
    }
  }
  populate(worldGenerations: WorldGenerations, attackPlantParents?: Creature[]): void {

    if (worldGenerations.currentGen === 1) {
        this.addCreaturesForGenus(worldGenerations, "attack_plant", worldGenerations.initialPopulation*HERBIVORES_PROPORTION );
        this.addCreaturesForGenus(worldGenerations, "plant", worldGenerations.initialPopulation*(1-HERBIVORES_PROPORTION) );
    } 
    else {
    
      if (!attackPlantParents) {
          throw new Error ("generations > 0 should have parents");
      }

      // only herbivores will be taken into account 
      const parents = attackPlantParents.filter(item => item._genus == "attack_plant");
      if (parents.length != attackPlantParents.length) {
        //TODO should be a warning
        throw new Error("PlantHerbivorePopulation is receiving non expected parent genus");
      }


      // Determine how many children per parent are needed
      const childrenPerParent = Math.max(
        Math.ceil(worldGenerations.initialPopulation * HERBIVORES_PROPORTION / parents.length),
        1
      );
      let totalNeededCreatures = worldGenerations.initialPopulation*HERBIVORES_PROPORTION - parents.length;

      // Add extra creatures to achieve the target population, but
      // we want all survivors to have at least one children
      let shuffledParents = shuffle(parents);
      
      //===================================================
      //TODO RD 23/4/25 - PROVES LIMITAR A INITIAL POPULATION
      if (totalNeededCreatures < 0 ) {
        for (let parentIdx = 0; parentIdx < worldGenerations.initialPopulation*HERBIVORES_PROPORTION; parentIdx++) {
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

      // now add plants to complete population
      this.addCreaturesForGenus(worldGenerations, "plant", worldGenerations.initialPopulation*(1-HERBIVORES_PROPORTION) );
    }

  }
}
