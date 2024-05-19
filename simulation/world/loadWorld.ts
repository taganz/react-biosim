import WorldController from "./WorldController";
import { SimulationData } from "../SimulationData";
import { SavedSimulationData } from "../serialization/data/SavedSimulationData";
import deserializeSimulationData from "../serialization/formatters/simulationDataSerialization";


export function loadSavedWorldAndResumeRun(worldController: WorldController, data: string)
               : SimulationData {
  const parsed : SavedSimulationData = JSON.parse(data);
  worldController.pause();
  const simulationData : SimulationData = deserializeSimulationData(parsed);
  worldController.resumeRun(simulationData);
  return simulationData;
}

export function loadSavedSimulationAndStartRun(worldController: WorldController, data: string) 
              : SimulationData {
  const parsed = JSON.parse(data) as SavedSimulationData;
  worldController.pause();
  const simulationData : SimulationData = deserializeSimulationData(parsed);
  const simCode = worldController.startRun(simulationData);
  simulationData.worldControllerData.simCode = simCode;
  return simulationData;
}
