import WorldGenerations from "../WorldGenerations";
import Creature from "../../creature/Creature";

export default interface PopulationStrategy {
  name: string;
  populate(generations: WorldGenerations, parents?: Creature[]): void;
}
