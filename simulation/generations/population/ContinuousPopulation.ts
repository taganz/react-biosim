import shuffle from "lodash.shuffle";
import WorldGenerations from "../WorldGenerations";
import {GridPosition} from "../../world/grid/Grid";
import Creature from "../../creature/Creature";
import PopulationStrategy from "./PopulationStrategy";
import * as constants from "@/simulation/simulationConstants";
import Genome from "../../creature/brain/Genome"
import AsexualRandomPopulation from "./AsexualRandomPopulation";


// Keep everything as is to make next generation a continuation of previous one
// Works with ContinuousSelection
export default class ContinuousPopulation implements PopulationStrategy {
  name = "ContinuousPopulation";
  populate(worldGenerations: WorldGenerations, parents?: Creature[]): void {
      //const creatures: Creature[] = [];

    // First generation
    if (worldGenerations.currentGen === 0) {
      const arp = new AsexualRandomPopulation();
      arp.populate (worldGenerations);
    }
     else
    {
      if (!parents) {
          throw new Error ("generations > 0 should have parents");
      }
      worldGenerations.copyCreatures(parents);
    }
  }
}
