import WorldGenerations from "../WorldGenerations";
import Creature from "../../creature/Creature";
import SelectionMethod from "./SelectionMethod";


/*

  1/6/24 - only selecting herbivores



*/

export default class GreatestMassSelection
  implements SelectionMethod
{
  name = "GreatestMassSelection";
  prettyName = "GreatestMass (herbivores)";  //TODO update when changed
  isContinuous = false;
  fitnessValueName = "Greatest mass";
  shouldResetLastCreatureIdCreatedEveryGeneration = true;

  getSurvivors(generations: WorldGenerations): {survivors: Creature[], fitnessMaxValue : number} {
    const topPercentSelected = generations.worldController.simData.constants.GREATEST_MASS_SELECTION_TOP_SURVIVORS;  
   
    const creaturesPreSelection = generations.currentCreatures.filter(item => item._genus === "attack_plant");
    console.warn("greatest mass selction only selecting herbivores");

    const massSorted : Creature [] = creaturesPreSelection.sort((a, b) =>{ return b.mass - a.mass});
    const top = Math.floor(generations.currentCreatures.length * topPercentSelected);   
    const fitMax = massSorted[0]?.mass;
    //console.log(worldController.currentGen, worldController.currentStep, " max value: ", fitMax, " cut value: ", distanceValuesSorted[top]?.distanceCovered);
    const parents = massSorted.slice(0, top)
    
    console.log(`GreatestMassSelection generation ${generations.currentGen}`);
    console.log(`top herbivore ${parents[0].id} mass ${parents[0].mass.toFixed(1)} massAtBirth ${parents[0].massAtBirth}`);
    console.log(parents[0].brain.genome.toString(generations));
    
    return {survivors: parents, fitnessMaxValue: fitMax};
  }

}
