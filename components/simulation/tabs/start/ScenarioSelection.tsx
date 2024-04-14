import React from 'react';
import {useSetAtom, useAtom, useAtomValue} from 'jotai';
import {worldControllerAtom, worldInitialValuesAtom} from "../../store/worldAtoms";
import {Dropdown} from "../../../global/inputs/Dropdown";
import {Option} from "../../../global/inputs/Dropdown";
import {scenarioObjects} from "./scenarios";
import { loadSimulationParameters, deserializeWorldInitialValues } from "@/simulation/serialization/loadWorld";
import SavedWorld from '@/simulation/serialization/data/SavedWorld';

export default function ScenariosSelection () {
    
  const worldController = useAtomValue(worldControllerAtom);
  const [worldInitialValues, setWorldInitialValues] = useAtom(worldInitialValuesAtom);


  const scenariosOptions: Option[] = Array.from({ length: scenarioObjects.length }, (_, i) => ({ value: i.toString(), label: scenarioObjects[i].name }));


  const handleSelection = (value: string) => {
    if (worldController) {
      const parsedScenario = scenarioObjects[parseInt(value)].data;
      //const data = parsedScenario.toString().concat('"lastCreatureIdCreated":0,"lastCreatureCount":0,"lastSurvivorsCount":0,"lastSurvivalRate":0,"lastGenerationDuration":0,"totalTime":0,"species":[], "generations":{"generations":[],"maxSurvivorCount":0,"minSurvivorCount":0,"maxFitnessValue":0');
      
      const wiv = deserializeWorldInitialValues(parsedScenario as SavedWorld);
      setWorldInitialValues(wiv);

      worldController.pause();
      loadSimulationParameters(worldController, parsedScenario as SavedWorld);  
      
      worldController.startRun();
      
    }
    else {
      console.warn("ScenariosSelection worldController not found!");
    }
  }
    
  
return (
  <div className="mb-1">
    <h2>Scenario for next simulation: </h2>
    <Dropdown options={scenariosOptions} onSelect={handleSelection} />
    <br/>
    <p>You need to restart the simulation for these scenario to work. </p>
  </div>
);
};
