import World from "../../world/World";
import Creature from "../Creature";
import SelectionMethod from "./SelectionMethod";

export default class ReproductionSelection
  implements SelectionMethod
{
  fitnessValueName = "Reproduction";
  
  getSurvivors(world: World): {survivors: Creature[], fitnessMaxValue : number} {
    
    const parents = [];
    
    for (const creature of world.currentCreatures) {
      
      if (
        creature.isAlive && creature.stepBirth > 1
      ) {
        parents.push(creature);
      }
    }
    const fitMax = 1;   // --> hauria de calcular el numero de fills que ha tingut cada especie?
    

    return {survivors: parents, fitnessMaxValue: fitMax};
  }

}
