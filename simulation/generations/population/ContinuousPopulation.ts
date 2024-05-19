import shuffle from "lodash.shuffle";
import WorldGenerations from "../WorldGenerations";
import Creature from "../../creature/Creature";
import PopulationStrategy from "./PopulationStrategy";
import AsexualRandomPopulation from "./AsexualRandomPopulation";


// Keep everything as is to make next generation a continuation of previous one
// Works with ContinuousSelection
export default class ContinuousPopulation implements PopulationStrategy {
  name = "ContinuousPopulation";
  populate(worldGenerations: WorldGenerations, parents?: Creature[]): void {
      //const creatures: Creature[] = [];

    // First generation
    if (worldGenerations.currentGen === 1) {
      const arp = new AsexualRandomPopulation();
      arp.populate (worldGenerations);
    }
     else
    {
      if (!parents) {
          throw new Error ("generations > 0 should have parents");
      }

      const newParents: Creature[] = parents.filter(creature => creature.stepBirth > 1);
      worldGenerations.updateCreatures(newParents);
    }
  }
}
