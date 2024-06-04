import WorldGenerations from "../WorldGenerations";
import Creature from "../../creature/Creature";
import SelectionMethod from "./SelectionMethod";


export default class GreatestDistanceSelection
  implements SelectionMethod
{
  name = "GreatestDistanceSelection";
  prettyName = "GreatestDistanceSelection";
  isContinuous = false;
  fitnessValueName = "Distance index";
  shouldResetLastCreatureIdCreatedEveryGeneration = true;
  
  getSurvivors(generations: WorldGenerations): {survivors: Creature[], fitnessMaxValue : number} {
    const topPercentSelected = generations.worldController.simData.constants.GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS;  
    const distanceValuesSorted : Creature [] = generations.currentCreatures.sort((a, b) =>{ return b.distanceCovered - a.distanceCovered});
    const top = Math.floor(generations.currentCreatures.length * topPercentSelected);   
    const fitMax = distanceValuesSorted[0]?.distanceCovered;
    //console.log(worldController.currentGen, worldController.currentStep, " max value: ", fitMax, " cut value: ", distanceValuesSorted[top]?.distanceCovered);
    const parents = distanceValuesSorted.slice(0, top)
    
    
    return {survivors: parents, fitnessMaxValue: fitMax};
  }

}
