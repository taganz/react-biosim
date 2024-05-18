import React from 'react';
import {atom, useSetAtom, useAtom, useAtomValue} from 'jotai';
import {worldControllerAtom, worldGenerationDataAtom, worldControllerDataAtom, worldCreaturesAtom, worldCanvasAtom, waterDataAtom} from "../../store/worldAtoms";
import {Dropdown} from "../../../global/inputs/Dropdown";
import {Option} from "../../../global/inputs/Dropdown";
import {scenarioObjects, ScenarioObjects} from "./scenarioObjects";
import {loadSavedWorldAndStartRun, loadSavedWorldAndResumeRun } from "@/simulation/serialization/loadWorld";
import SavedWorld from '@/simulation/serialization/data/SavedWorld';

  
export default function ScenariosSelection () {
    
  const worldController = useAtomValue(worldControllerAtom);
  const worldCanvas = useAtomValue(worldCanvasAtom);
  const setWorldControllerData = useSetAtom(worldControllerDataAtom);
  const setWorldGenerationData = useSetAtom(worldGenerationDataAtom);
  const setWaterData = useSetAtom(waterDataAtom);
  

  const scenariosOptions: Option[] = Array.from({ length: scenarioObjects.length }, (_, i) => ({ value: i.toString(), label: scenarioObjects[i].name }));

  // functionloadScenario
  const handleSelection = async (value: string) => {
    if (worldController && worldCanvas) {
        try {
          const scenario = scenarioObjects[parseInt(value)];
          const filename = scenario.filename;
          const response = await fetch(filename!);
          const parsedScenario = await response.text();          
          if (scenario.action == "startRun") {
            var [readWorldControllerData, readWorldGenerationData]  = loadSavedWorldAndStartRun(worldController, parsedScenario as string);
          }
          else {
            var [readWorldControllerData, readWorldGenerationData]  = loadSavedWorldAndResumeRun(worldController, parsedScenario as string);
          }
          worldCanvas.size = readWorldControllerData.size;
          setWorldGenerationData(readWorldGenerationData);
          setWorldControllerData(readWorldControllerData);
          setWaterData(readWorldControllerData.waterData);
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
