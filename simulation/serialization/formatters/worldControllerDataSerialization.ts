import WorldController from '@/simulation/world/WorldController';
import WorldControllerData from '@/simulation/world/WorldControllerData';
import SavedWorldControllerData from "../data/SavedWorldControllerData"
import {serializeObjects, deserializeObjects} from "./objectsSerialization"
import SavedWorld from "../data/SavedWorld"

export default function serializeWorldControllerData(worldController: WorldController) : SavedWorldControllerData {

    const objects = serializeObjects(worldController.objects);

    return {
         // initial values
        simCode: worldController.simCode,
        size: worldController.size, 
        stepsPerGen: worldController.stepsPerGen,
        initialPopulation: worldController.initialPopulation,
        worldObjects : objects,
        gridPointWaterDefault: worldController.gridPointWaterDefault,
        gridPointWaterCapacityDefault: worldController.gridPointWaterCapacityDefault,

        // user values
        pauseBetweenSteps: worldController.pauseBetweenSteps,
        immediateSteps: worldController.immediateSteps,
        pauseBetweenGenerations: worldController.pauseBetweenGenerations,

        // state values
        currentGen: worldController.currentGen,
        currentStep: worldController.currentStep,
        lastGenerationDuration: worldController.lastGenerationDuration,
        totalTime: worldController.totalTime,
    }
}


  
export function deserializeWorldControllerData (parsed: SavedWorld) : WorldControllerData {
    const wordControllerData : WorldControllerData = {
        // initial values
        size: parsed.worldControllerData.size, 
        stepsPerGen: parsed.worldControllerData.stepsPerGen,
        initialPopulation: parsed.worldControllerData.initialPopulation,
        worldObjects: [...deserializeObjects(parsed.worldControllerData.worldObjects)],
        gridPointWaterDefault: parsed.worldControllerData.gridPointWaterDefault,
        gridPointWaterCapacityDefault: parsed.worldControllerData.gridPointWaterCapacityDefault,
        // user values
        pauseBetweenSteps: parsed.worldControllerData.pauseBetweenSteps,
        immediateSteps: parsed.worldControllerData.immediateSteps,
        pauseBetweenGenerations: parsed.worldControllerData.pauseBetweenGenerations,
        
        // state values
        simCode: parsed.worldControllerData.simCode,
        currentGen: parsed.worldControllerData.currentGen,
        currentStep: parsed.worldControllerData.currentStep,
        lastGenerationDuration: parsed.worldControllerData.lastGenerationDuration,
        totalTime: parsed.worldControllerData.totalTime
    }
    return wordControllerData;
}

    