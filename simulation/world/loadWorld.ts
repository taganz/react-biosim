import WorldController from "./WorldController";
import { SimulationData } from "../SimulationData";
import { SavedSimulationData } from "../serialization/data/SavedSimulationData";
import deserializeSimulationData from "../serialization/formatters/simulationDataSerialization";


// parse and deserialize before touching the running simulation, so a bad file leaves it running
export function loadSavedWorldAndResumeRun(worldController: WorldController, data: string)
               : SimulationData {
  const parsed : SavedSimulationData = JSON.parse(data);
  const simulationData : SimulationData = deserializeSimulationData(worldController, parsed);
  worldController.pause();
  worldController.resumeRun(simulationData);
  return simulationData;
}

export function loadSavedSimulationAndStartRun(worldController: WorldController, data: string) 
              : SimulationData {
  const parsed = JSON.parse(data) as SavedSimulationData;
  const simulationData : SimulationData = deserializeSimulationData(worldController, parsed);
  worldController.pause();
  const simCode = worldController.startRun(simulationData);
  simulationData.worldControllerData.simCode = simCode;
  return simulationData;
}
