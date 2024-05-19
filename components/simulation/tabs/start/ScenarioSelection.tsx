import React from 'react';
import {atom, useSetAtom, useAtom, useAtomValue} from 'jotai';
import { simulationDataAtom,
  worldControllerAtom,
  //worldControllerDataAtom,
  //worldGenerationDataAtom,
  //waterDataAtom,
  //simulationConstantsDataAtom, 
  //worldObjectsDataAtom,
  worldCanvasAtom
} from "../../store";
import {Dropdown} from "../../../global/inputs/Dropdown";
import {Option} from "../../../global/inputs/Dropdown";
import {scenarioObjects} from "./scenarioObjects";
import {loadSavedSimulationAndStartRun, loadSavedWorldAndResumeRun } from "@/simulation/world/loadWorld";
//import { SavedSimulationData } from "@/simulation/serialization/data/SavedSimulationData";
  
export default function ScenariosSelection () {
    
  const worldCanvas = useAtomValue(worldCanvasAtom);
  const worldController = useAtomValue(worldControllerAtom);
  //const setWorldGenerationData = useSetAtom(worldGenerationDataAtom);
  //const setWorldControllerData = useSetAtom(worldControllerDataAtom);
  //const setWaterData = useSetAtom(waterDataAtom);
  const setSimulationData = useSetAtom(simulationDataAtom);
  //const setSimulationConstantsData = useSetAtom(simulationConstantsDataAtom);
  //const setWorldObjectsData = useSetAtom(worldObjectsDataAtom)
  
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
          //setWorldGenerationData(simulationData.worldGenerationsData);
          //setWorldControllerData(simulationData.worldControllerData);
          //setWaterData(simulationData.waterData);
          //setSimulationConstantsData(simulationData.constants);
          //setWorldObjectsData(simulationData.worldObjects);
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
    <h2>Select simulation scenario: </h2>
    <Dropdown options={scenariosOptions} onSelect={handleSelection} />
    <br/>
  </div>
);
};
