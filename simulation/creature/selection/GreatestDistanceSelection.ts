import WorldGenerations from "../../world/WorldGenerations";
import Creature from "../Creature";
import SelectionMethod from "./SelectionMethod";
import {GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS} from "../../simulationConstants"

const topPercentSelected = GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS;  

export default class GreatestDistanceSelection
  implements SelectionMethod
{
  fitnessValueName = "Distance index";
  
  getSurvivors(generations: WorldGenerations): {survivors: Creature[], fitnessMaxValue : number} {
    const distanceValuesSorted : Creature [] = generations.currentCreatures.sort((a, b) =>{ return b.distanceCovered - a.distanceCovered});
    const top = Math.floor(generations.currentCreatures.length * topPercentSelected);   
    const fitMax = distanceValuesSorted[0]?.distanceCovered;
    //console.log(worldController.currentGen, worldController.currentStep, " max value: ", fitMax, " cut value: ", distanceValuesSorted[top]?.distanceCovered);
    const parents = distanceValuesSorted.slice(0, top)
    
    
    return {survivors: parents, fitnessMaxValue: fitMax};
  }

}
