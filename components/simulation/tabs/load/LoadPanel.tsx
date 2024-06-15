"use client";

import Button from "@/components/global/Button";
import { simulationDataAtom,
        worldControllerAtom,
      } from "../../store";
import { useAtomValue, useSetAtom, useAtom } from "jotai";
import { useState } from "react";
import { loadSavedWorldAndResumeRun } from "@/simulation/world/loadWorld";
import TextareaInput from "@/components/global/inputs/TextareaInput";

export default function LoadPanel() {
  const worldController = useAtomValue(worldControllerAtom);
  const setSimulationData = useSetAtom(simulationDataAtom);
  const [pastedData, setPastedData] = useState("");

  const handleLoadPasted = () => {
    if (worldController) {
      const simulationData = loadSavedWorldAndResumeRun(worldController, pastedData);
      setSimulationData(simulationData);

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
      }
    }
    fileReader.onerror = () => {
      console.log(fileReader.error);
    } 
  };

  
  return (
    <div>
        <input 
          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:font-semibold"
          type="file"
          multiple={false}
          onChange={handleLoadFile}></input>
        <br/>
        <br/>
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

      </div>
    </div>
  );
}
