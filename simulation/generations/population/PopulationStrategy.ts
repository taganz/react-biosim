import WorldGenerations from "../WorldGenerations";
import Creature from "../../creature/Creature";

/** Places the creatures of a new generation on the grid. See docs/reference/population-and-selection.md */
export default interface PopulationStrategy {
  /** Class name; saved in files and used as key in populationMap */
  name: string;
  /**
   * Adds creatures with generations.newCreature(). Called with no parents for
   * generation 1, and with the survivors of the selection method afterwards.
   */
  populate(generations: WorldGenerations, parents?: Creature[]): void;
}
