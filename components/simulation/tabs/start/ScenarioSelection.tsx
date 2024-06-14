import React from 'react';
import {atom, useSetAtom, useAtom, useAtomValue} from 'jotai';
import { simulationDataAtom,
  worldControllerAtom,
  worldCanvasAtom
} from "../../store";
import {Dropdown} from "../../../global/inputs/Dropdown";
import {Option} from "../../../global/inputs/Dropdown";
import {scenarioObjects} from "./scenarioObjects";
import {loadSavedSimulationAndStartRun, loadSavedWorldAndResumeRun } from "@/simulation/world/loadWorld";
  
export default function ScenariosSelection () {
    
  const worldCanvas = useAtomValue(worldCanvasAtom);
  const worldController = useAtomValue(worldControllerAtom);
  const setSimulationData = useSetAtom(simulationDataAtom);
  
  const scenariosOptions: Option[] = Array.from({ length: scenarioObjects.length }, (_, i) => ({ value: i.toString(), label: scenarioObjects[i].name }));

  // functionloadScenario
  const handleSelection = async (value: string) => {
    if (worldController && worldCanvas) {
        try {
          const scenario = scenarioObjects[parseInt(value)];
          const filename = scenario.filename;
          const response = await fetch(filename!);
          const readSimulationString = await response.text();          
          if (scenario.action == "startRun") {
            var simulationData  = loadSavedSimulationAndStartRun(worldController, readSimulationString);
          }
          else {
            var simulationData  = loadSavedWorldAndResumeRun(worldController, readSimulationString);
          }

          worldCanvas.size = simulationData.worldControllerData.size;
          setSimulationData(simulationData);
        } catch (error) {
          console.error('Error reading file:', error);
      }
    }    
    else {
      console.warn("ScenariosSelection worldController or worldCanvas not found!");
    }
  }

return (
  <div className="mb-1">
    <br/>
    <Dropdown options={scenariosOptions} onSelect={handleSelection} />
    <br/>
  </div>
);
};
