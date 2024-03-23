import World from "../../world/World";
import Creature from "../Creature";

export default interface SelectionMethod {
  fitnessValueName: string;
  getSurvivors(world: World): {survivors: Creature[], fitnessMaxValue : number};
  //onDrawBeforeCreatures?(world: World): void;
  //onDrawAfterCreatures?(world: World): void;
}
