import {Grid} from "../../world/grid/Grid";
import Creature from "../Creature";
import WorldGenerations from "../../world/WorldGenerations";

export default interface SelectionMethod {
  fitnessValueName: string;
  getSurvivors(generations: WorldGenerations): {survivors: Creature[], fitnessMaxValue : number};
  //onDrawBeforeCreatures?(worldController: WorldController): void;
  //onDrawAfterCreatures?(worldController: WorldController): void;
}
