import World from "../../world/World";
import Creature from "../Creature";
import SelectionMethod from "./SelectionMethod";
import {GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS} from "../../simulationConstants"

const topPercentSelected = GREATEST_DISTANCE_SELECTION_TOP_SURVIVORS;  

export default class GreatestDistanceSelection
  implements SelectionMethod
{
  fitnessValueName = "Distance index";
  
  getSurvivors(world: World): {survivors: Creature[], fitnessMaxValue : number} {
    const distanceValuesSorted : Creature [] = world.currentCreatures.sort((a, b) =>{ return b.distanceCovered - a.distanceCovered});
    const top = Math.floor(world.currentCreatures.length * topPercentSelected);   
    const fitMax = distanceValuesSorted[0]?.distanceCovered;
    //console.log(world.currentGen, world.currentStep, " max value: ", fitMax, " cut value: ", distanceValuesSorted[top]?.distanceCovered);
    const parents = distanceValuesSorted.slice(0, top)
    
    
    return {survivors: parents, fitnessMaxValue: fitMax};
  }

}
