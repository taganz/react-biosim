import WorldController from "@/simulation/world/WorldController";
import WorldControllerData from "@/simulation/world/WorldControllerData";
import SavedWorldControllerData from "../data/SavedWorldControllerData";
import { getRandomState } from "@/simulation/helpers/random";

export function deserializeWorldControllerData(parsed: SavedWorldControllerData) : WorldControllerData {
  // older saves have ATTACK_MULTIPLE_MASS_AT_BIRTH and MASS_COST_PER_EXECUTE_ACTION, which no longer exist
  const { ATTACK_MULTIPLE_MASS_AT_BIRTH, MASS_COST_PER_EXECUTE_ACTION, ...worldControllerData } =
    parsed as SavedWorldControllerData & { ATTACK_MULTIPLE_MASS_AT_BIRTH?: number, MASS_COST_PER_EXECUTE_ACTION?: number };
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
