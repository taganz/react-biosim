import WorldGenerationsData from "@/simulation/generations/WorldGenerationsData";
import {SavedSelectionMethod} from "@/simulation/generations/selection/selectionMethodFormatter";
import {SavedPopulationStrategy} from "@/simulation/generations/population/populationStrategyFormatter";
import {SavedMutationMode} from "@/simulation/creature/brain/MutationMode"

/** WorldGenerationsData with the strategy, the selection method and the mutation mode saved by name */
export default interface SavedWorldGenerationData
  extends Omit<WorldGenerationsData, "populationStrategy" | "selectionMethod" | "mutationMode"> {
  populationStrategy: SavedPopulationStrategy;
  selectionMethod: SavedSelectionMethod;
  mutationMode: SavedMutationMode;
}
