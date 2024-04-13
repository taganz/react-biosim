import WorldGenerations from "../../world/WorldGenerations";
import Creature from "../Creature";

export default interface PopulationStrategy {
  name: string;
  populate(generations: WorldGenerations, parents?: Creature[]): void;
}
