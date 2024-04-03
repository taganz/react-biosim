import World from "../../world/World";
import Creature from "../Creature";
import SelectionMethod from "./SelectionMethod";

export default class InsideReproductionAreaSelection
  implements SelectionMethod
{
  fitnessValueName = "Survival rate (%)";

  getSurvivors(world: World): {survivors: Creature[], fitnessMaxValue : number} {
    const parents = [];

    for (const creature of world.currentCreatures) {
      const gridPoint = world.grid.cell(creature.position[0], creature.position[1]);

      if (
        creature.isAlive &&
        gridPoint.objects.find((obj) => obj.areaType === 0)
      ) {
        parents.push(creature);
      }
    }

    const fit = Number((parents.length/world.initialPopulation*100).toFixed(1));

    return {survivors: parents, fitnessMaxValue: fit};
  }
}
