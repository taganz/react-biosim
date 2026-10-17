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
  // a file saved at the start of a generation has genomes instead of creatures
  if (simulationData.startGenomes) {
    worldController.startGeneration(simulationData);
  } else {
    worldController.resumeRun(simulationData);
  }
  return simulationData;
}

export function loadSavedSimulationAndStartRun(worldController: WorldController, data: string) 
              : SimulationData {
  const parsed = JSON.parse(data) as SavedSimulationData;
  const simulationData : SimulationData = deserializeSimulationData(worldController, parsed);
  worldController.pause();
  // the run keeps the code of the file (a new random one if it has none),
  // and like any loaded code it is replaced at the next restart
  worldController.startRun(simulationData, simulationData.worldControllerData.simCode || undefined);
  worldController.isSimCodeRandom = true;
  return simulationData;
}
