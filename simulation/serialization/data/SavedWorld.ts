import SavedGenerationRegistry from "./SavedGenerationRegistry";
import SavedSpecies from "./SavedSpecies";
import SavedWorldInitialValues from "./SavedWorldInitialValues";
import WorldInitialValues from "@/simulation/world/WorldInitialValues";

export default interface SavedWorld {
  
  worldInitialValues: SavedWorldInitialValues;

  // simulation parameters
  currentGen: number;
  currentStep: number;
  pauseBetweenSteps: number;
  immediateSteps: number;
  deletionRatio: number;
  pauseBetweenGenerations: number;

  // run values
  lastCreatureIdCreated: number;
  lastCreatureCount: number;
  lastSurvivorsCount: number;
  lastSurvivalRate: number;
  lastGenerationDuration: number;
  totalTime: number;

  species: SavedSpecies[];

  generations: SavedGenerationRegistry;
}
