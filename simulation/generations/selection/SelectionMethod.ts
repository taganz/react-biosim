import {Grid} from "../../world/grid/Grid";
import Creature from "../../creature/Creature";
import WorldGenerations from "../WorldGenerations";

/** Chooses the parents of the next generation. See docs/reference/population-and-selection.md */
export default interface SelectionMethod {
  /** Class name; saved in files and used as key in selectionMap */
  name: string;
  prettyName: string;
  /** If true, creatures reproduce during the generation and the water is not reset between generations */
  isContinuous: boolean;
  /** Title of the fitness chart in the Stats tab */
  fitnessValueName: string;
  shouldResetLastCreatureIdCreatedEveryGeneration : boolean;
  /** Called at the end of a generation; fitnessMaxValue is the value plotted in the Stats tab */
  getSurvivors(generations: WorldGenerations): {survivors: Creature[], fitnessMaxValue : number};
  //onDrawBeforeCreatures?(worldController: WorldController): void;
  //onDrawAfterCreatures?(worldController: WorldController): void;
}
