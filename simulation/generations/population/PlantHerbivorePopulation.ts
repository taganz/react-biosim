import shuffle from "lodash.shuffle";
import WorldGenerations from "../WorldGenerations";
import {GridPosition} from "../../world/grid/Grid";
import Creature from "../../creature/Creature";
import PopulationStrategy from "./PopulationStrategy";
import Genome from "../../creature/brain/Genome"
import CreatureGenus, { Genus } from "@/simulation/creature/CreatureGenus";
import { selectGenusBasedOnProbability } from "./selectGenusBasedOnProbability"; 
import { addCreaturesFromGenus, addCreaturesFromParent } from "./addCreatures";

/* 
  WORK

  populate with a given distribution of plants and herbivores

  plants are created by genus
  attackPlants are created from parents

*/
const HERBIVORES_PROPORTION = 0.2;

// if a SpawnZone object exists, centers population around it, if not, replicate RandomPopulation
export default class PlantHerbivorePopulation implements PopulationStrategy {
  name = "PlantHerbivorePopulation";


  populate(worldGenerations: WorldGenerations, attackPlantParents?: Creature[]): void {

    if (worldGenerations.currentGen === 1) {
        addCreaturesFromGenus(worldGenerations, "attack_plant", worldGenerations.initialPopulation*HERBIVORES_PROPORTION );
        addCreaturesFromGenus(worldGenerations, "plant", worldGenerations.initialPopulation*(1-HERBIVORES_PROPORTION) );
    } 
    else {
      if (!attackPlantParents) {throw new Error ("generations > 0 should have parents");}

      // only herbivore parents will be taken into account 
      const parents = attackPlantParents.filter(item => item._genus == "attack_plant");
      if (parents.length != attackPlantParents.length) {
        //TODO should be a warning
        throw new Error("PlantHerbivorePopulation is receiving non expected parent genus");
      }

      let totalNeededCreatures = worldGenerations.initialPopulation*HERBIVORES_PROPORTION - parents.length;
      
      // more parents that needed creatures?
      if (totalNeededCreatures < 0 ) {
        for (let parentIdx = 0; parentIdx < worldGenerations.initialPopulation*HERBIVORES_PROPORTION; parentIdx++) {
          addCreaturesFromParent(worldGenerations, parents[parentIdx], 1);
        }
        return;
      }
            
      // Add extra creatures to achieve the target population, but
      // we want all survivors to have at least one children
      let shuffledParents = shuffle(parents);
      const childrenPerParent = Math.max(
        Math.ceil(worldGenerations.initialPopulation * HERBIVORES_PROPORTION / parents.length),
        1
      );

      for (let parentIdx = 0; parentIdx < shuffledParents.length; parentIdx++) {
        const parent = shuffledParents[parentIdx];
        for (let childIdx = 0; childIdx < childrenPerParent; childIdx++) {
          if (childIdx === 0 || totalNeededCreatures > 0) {
            if (childIdx > 0) {
              totalNeededCreatures--;
            }
            addCreaturesFromParent(worldGenerations, parent, 1);
          }
        }
      }

      // now add plants to complete population
      addCreaturesFromGenus(worldGenerations, "plant", worldGenerations.initialPopulation*(1-HERBIVORES_PROPORTION) );
    }

  }
}
