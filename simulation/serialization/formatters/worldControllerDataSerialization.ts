import WorldController from "@/simulation/world/WorldController";
import WorldControllerData from "@/simulation/world/WorldControllerData";
import SavedWorldControllerData from "../data/SavedWorldControllerData";

export function deserializeWorldControllerData(parsed: SavedWorldControllerData) : WorldControllerData {
  const worldControllerData : WorldControllerData = parsed;
  return worldControllerData;
}
    

export function serializeWorldControllerData(worldController: WorldController) : SavedWorldControllerData {
  const worldControllerData = worldController.simData.worldControllerData;
  worldControllerData.simCode = worldControllerData.simCode;
  worldControllerData.currentGen = worldControllerData.currentGen;
  worldControllerData.currentStep = worldControllerData.currentStep;
  worldControllerData.lastGenerationDuration = worldControllerData.lastGenerationDuration;
  worldControllerData.totalTime = worldControllerData.totalTime;
  const parsed : SavedWorldControllerData = worldControllerData;
  return parsed;
}