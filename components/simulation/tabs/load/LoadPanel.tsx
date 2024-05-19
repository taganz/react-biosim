"use client";

import Button from "@/components/global/Button";
import { simulationDataAtom,
        worldControllerAtom,
        //worldControllerDataAtom,
        //worldGenerationDataAtom,
        //waterDataAtom,
        //simulationConstantsDataAtom, 
        //worldObjectsDataAtom
      } from "../../store";
import { useAtomValue, useSetAtom, useAtom } from "jotai";
import { useState } from "react";
import { loadSavedWorldAndResumeRun } from "@/simulation/world/loadWorld";
import TextareaInput from "@/components/global/inputs/TextareaInput";

export default function LoadPanel() {
  const worldController = useAtomValue(worldControllerAtom);
  //const setWorldGenerationData = useSetAtom(worldGenerationDataAtom);
  //const setWorldControllerData = useSetAtom(worldControllerDataAtom);
  //const setWaterData = useSetAtom(waterDataAtom);
  const setSimulationData = useSetAtom(simulationDataAtom);
  //const setSimulationConstantsData = useSetAtom(simulationConstantsDataAtom);
  //const setWorldObjectsData = useSetAtom(worldObjectsDataAtom)
  const [pastedData, setPastedData] = useState("");

  const handleLoadPasted = () => {
    if (worldController) {
      const simulationData = loadSavedWorldAndResumeRun(worldController, pastedData);
      setSimulationData(simulationData);
      //setWorldGenerationData(simulationData.worldGenerationsData);
      //setWorldControllerData(simulationData.worldControllerData);
      //setWaterData(simulationData.waterData);
      //setSimulationConstantsData(simulationData.constants);
      //setWorldObjectsData(simulationData.worldObjects);
    } else {
      console.warn("LoadPanel worldController not found!");
    }
  };

  const handleLoadFile = (e : any) => {
    const file = e.target.files[0]; 
    if (!file) {
      return;
    }
    const fileReader = new FileReader(); 
    fileReader.readAsText( file ) ; 
    fileReader.onload  = () => {
      const data = fileReader.result as string;
      setPastedData(data);
      if (worldController) {
        const simulationData = loadSavedWorldAndResumeRun(worldController, data);
        setSimulationData(simulationData);
        //setWorldGenerationData(simulationData.worldGenerationsData);
        //setWorldControllerData(simulationData.worldControllerData);
        //setWaterData(simulationData.waterData);
        //setSimulationConstantsData(simulationData.constants);
        //setWorldObjectsData(simulationData.worldObjects);
      }
    }
    fileReader.onerror = () => {
      console.log(fileReader.error);
    } 
  };

  
  return (
    <div>
      <p className="mb-2">
        Paste below the JSON code of a previously saved worldController and load it with
        the &quot;Load&quot; button.
      </p>

      <TextareaInput
        value={pastedData}
        onChange={(e) => setPastedData(e.target.value)}
        minRows={2}
        maxRows={20}
      />

      {/*<div className="mt-2 text-center">*/}
      <div className="mt-2">
        <Button onClick={handleLoadPasted}>Load</Button>
        <br/><p>Beta:</p><br/>
        <input 
          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:font-semibold"
          type="file"
          multiple={false}
          onChange={handleLoadFile}></input>
      </div>
    </div>
  );
}
