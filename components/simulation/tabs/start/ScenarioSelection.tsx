import React from 'react';
import {useSetAtom, useAtom, useAtomValue} from 'jotai';
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

/*
  const handleSelection = (value: string) => {
    if (worldController) {
      const parsedScenario = scenarioObjects[parseInt(value)].data;
      //const data = parsedScenario.toString().concat('"lastCreatureIdCreated":0,"lastCreatureCount":0,"lastSurvivorsCount":0,"lastSurvivalRate":0,"lastGenerationDuration":0,"totalTime":0,"species":[], "generations":{"generations":[],"maxSurvivorCount":0,"minSurvivorCount":0,"maxFitnessValue":0');
      
      //TODO revisar el "as unknown"!
      const [readWorldControllerData, readWorldGenerationData]  = loadSavedWorldAndStartRun(worldController, parsedScenario as string);
      setWorldGenerationData(readWorldGenerationData);
      setWorldControllerData(readWorldControllerData);
      
    }
    else {
      console.warn("ScenariosSelection worldController not found!");
    }
  }
*/
  // functionloadScenario
  const handleSelection2 = async (value: string) => {
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
    <Dropdown options={scenariosOptions} onSelect={handleSelection2} />
    <br/>
  </div>
);
};
