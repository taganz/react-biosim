import WorldGenerations from "../WorldGenerations";
import Creature from "../../creature/Creature";
import SelectionMethod from "./SelectionMethod";


// Keep everything as is to make next generation a continuation of previous one
// Works with ContinuousPopulation
export default class ContinuousSelection
  implements SelectionMethod
{
  name = "ContinuousSelection";
  fitnessValueName = "ContinuousSelection Fitness Value TBD";
  shouldResetLastCreatureIdCreatedEveryGeneration = false;
  
  getSurvivors(generations: WorldGenerations): {survivors: Creature[], fitnessMaxValue : number} {
    const parents = generations.currentCreatures;
    const fitMax = parents.length;   
    
    return {survivors: parents, fitnessMaxValue: fitMax};
  }

}
