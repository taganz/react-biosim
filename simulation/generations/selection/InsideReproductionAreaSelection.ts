import WorldGenerations from "@/simulation/generations/WorldGenerations";
import {Grid} from "../../world/grid/Grid";
import Creature from "../../creature/Creature";
import SelectionMethod from "./SelectionMethod";

export default class InsideReproductionAreaSelection
  implements SelectionMethod
{
  name = "InsideReproductionAreaSelection";
  fitnessValueName = "Survival rate (%)";

  getSurvivors(generations: WorldGenerations): {survivors: Creature[], fitnessMaxValue : number} {
    const parents = [];

    for (const creature of generations.currentCreatures) {
      const gridPoint = generations.grid.cell(creature.position[0], creature.position[1]);

      if (
        creature.isAlive &&
        gridPoint.objects.find((obj) => obj.areaType === 0)
      ) {
        parents.push(creature);
      }
    }

    const fit = Number((parents.length/generations.initialPopulation*100).toFixed(1));

    return {survivors: parents, fitnessMaxValue: fit};
  }
}
