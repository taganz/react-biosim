import WorldController from "@/simulation/world/WorldController";
import WorldControllerData from "@/simulation/world/WorldControllerData";
import SavedWorldControllerData from "../data/SavedWorldControllerData";
import { getRandomState } from "@/simulation/helpers/random";

export function deserializeWorldControllerData(parsed: SavedWorldControllerData) : WorldControllerData {
  // older saves have ATTACK_MULTIPLE_MASS_AT_BIRTH and MASS_COST_PER_EXECUTE_ACTION, which no longer exist
  const { ATTACK_MULTIPLE_MASS_AT_BIRTH, MASS_COST_PER_EXECUTE_ACTION, ...worldControllerData } =
    parsed as SavedWorldControllerData & { ATTACK_MULTIPLE_MASS_AT_BIRTH?: number, MASS_COST_PER_EXECUTE_ACTION?: number };
  // older saves have no ACTION_ATTACK_OFFSET: their attacks used ACTION_REPRODUCTION_OFFSET
  // nor MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY: every gene cost MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE
  return {
    ...worldControllerData,
    ACTION_ATTACK_OFFSET: worldControllerData.ACTION_ATTACK_OFFSET ?? worldControllerData.ACTION_REPRODUCTION_OFFSET,
    MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY: worldControllerData.MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY
      ?? worldControllerData.MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE,
  };
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
