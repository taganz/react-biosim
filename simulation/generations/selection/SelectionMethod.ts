import {Grid} from "../../world/grid/Grid";
import Creature from "../../creature/Creature";
import WorldGenerations from "../WorldGenerations";

export default interface SelectionMethod {
  name: string;
  isContinuous: boolean;
  fitnessValueName: string;
  shouldResetLastCreatureIdCreatedEveryGeneration : boolean;
  getSurvivors(generations: WorldGenerations): {survivors: Creature[], fitnessMaxValue : number};
  //onDrawBeforeCreatures?(worldController: WorldController): void;
  //onDrawAfterCreatures?(worldController: WorldController): void;
}
