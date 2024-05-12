import WorldGenerations from "../WorldGenerations";
import Creature from "../../creature/Creature";
import SelectionMethod from "./SelectionMethod";

export default class ReproductionSelection
  implements SelectionMethod
{
  name = "ReproductionSelection";
  fitnessValueName = "Reproduction";
  shouldResetLastCreatureIdCreatedEveryGeneration = true;
  
  getSurvivors(generations: WorldGenerations): {survivors: Creature[], fitnessMaxValue : number} {
    
    const parents = [];
    
    for (const creature of generations.currentCreatures) {
      
      if (creature.isAlive && creature.stepBirth > 1) {
        parents.push(creature);
      }
    }
    const fitMax = parents.length;   //TODO hauria de calcular el numero de fills que ha tingut cada especie?
    //console.log("reproductionSelection survivors: ", parents.length)

    return {survivors: parents, fitnessMaxValue: fitMax};
  }

}
