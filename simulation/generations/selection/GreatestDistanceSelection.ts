import WorldGenerations from "../WorldGenerations";
import Creature from "../../creature/Creature";
import SelectionMethod from "./SelectionMethod";
import { shuffle } from "../../helpers/random";


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
    // a creature killed in the last step can still be in the list
    const living = generations.currentCreatures.filter((creature) => creature.isAlive);
    if (living.length === 0) return {survivors: [], fitnessMaxValue: 0};

    // shuffled first so that ties, such as the many creatures at 0 in the first generations,
    // are broken at random and not by list order; the sort is stable. It also leaves
    // currentCreatures in its order
    const sorted = shuffle(living).sort((a, b) => b.distanceCovered - a.distanceCovered);
    // at least one survivor, or a small population would die out
    const top = Math.max(1, Math.floor(living.length * topPercentSelected));

    return {survivors: sorted.slice(0, top), fitnessMaxValue: sorted[0].distanceCovered};
  }

}
