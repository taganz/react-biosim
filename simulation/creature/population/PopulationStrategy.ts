import WorldGenerations from "../../world/WorldGenerations";
import Creature from "../Creature";

export default interface PopulationStrategy {
  populate(generations: WorldGenerations, parents?: Creature[]): void;
}
