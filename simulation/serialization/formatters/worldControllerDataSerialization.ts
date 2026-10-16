import WorldController from "@/simulation/world/WorldController";
import WorldControllerData from "@/simulation/world/WorldControllerData";
import SavedWorldControllerData from "../data/SavedWorldControllerData";
import { getRandomState } from "@/simulation/helpers/random";

export function deserializeWorldControllerData(parsed: SavedWorldControllerData) : WorldControllerData {
  const worldControllerData : WorldControllerData = parsed;
  return worldControllerData;
}
    

export function serializeWorldControllerData(worldController: WorldController) : SavedWorldControllerData {
  // settings come from the running configuration, run state from the controller
  return {
    ...worldController.simData.worldControllerData,
    pauseBetweenSteps: worldController.pauseBetweenSteps,
    immediateSteps: worldController.immediateSteps,
    pauseBetweenGenerations: worldController.pauseBetweenGenerations,
    simCode: worldController.simCode,
    currentGen: worldController.currentGen,
    currentStep: worldController.currentStep,
    lastGenerationDuration: worldController.lastGenerationDuration,
    totalTime: worldController.totalTime,
    runSeed: worldController.seed,
    rngState: getRandomState(),
  };
}
