import React from 'react';
import {atom, useSetAtom, useAtom, useAtomValue} from 'jotai';
import {worldControllerAtom, worldGenerationDataAtom, worldControllerDataAtom} from "../../store/worldAtoms";
import {Dropdown} from "../../../global/inputs/Dropdown";
import {Option} from "../../../global/inputs/Dropdown";
import {scenarioObjects, ScenarioObjects} from "./scenarioObjects";
import {loadSavedWorldAndStartRun } from "@/simulation/serialization/loadWorld";
import SavedWorld from '@/simulation/serialization/data/SavedWorld';

  
export default function ScenariosSelection () {
    
  const worldController = useAtomValue(worldControllerAtom);
  const setWorldControllerData = useSetAtom(worldControllerDataAtom);
  const setWorldGenerationData = useSetAtom(worldGenerationDataAtom);
  

  const scenariosOptions: Option[] = Array.from({ length: scenarioObjects.length }, (_, i) => ({ value: i.toString(), label: scenarioObjects[i].name }));

  // functionloadScenario
  const handleSelection = async (value: string) => {
    if (worldController) {
        try {
          const filename = scenarioObjects[parseInt(value)].filename;
          const response = await fetch(filename!);
          const parsedScenario = await response.text();          
          const [readWorldControllerData, readWorldGenerationData]  = loadSavedWorldAndStartRun(worldController, parsedScenario as string);
          setWorldGenerationData(readWorldGenerationData);
          setWorldControllerData(readWorldControllerData);
        } catch (error) {
          console.error('Error reading file:', error);
      }
    }    
    else {
      console.warn("ScenariosSelection worldController not found!");
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
