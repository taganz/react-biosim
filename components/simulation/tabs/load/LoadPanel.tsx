"use client";

import Button from "@/components/global/Button";
import { worldControllerAtom, worldControllerDataAtom, worldGenerationDataAtom, waterDataAtom } from "../../store";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { loadSavedWorldAndResumeRun } from "@/simulation/serialization/loadWorld";
import TextareaInput from "@/components/global/inputs/TextareaInput";

export default function LoadPanel() {
  const worldController = useAtomValue(worldControllerAtom);
  const setWorldGenerationData = useSetAtom(worldGenerationDataAtom);
  const setWorldControllerData = useSetAtom(worldControllerDataAtom);
  const setWaterData = useSetAtom(waterDataAtom);

  const [data, setData] = useState("");

  const handleLoadPasted = () => {
    if (worldController) {
      const [readWorldControllerData, readWorldGenerationData] = loadSavedWorldAndResumeRun(worldController, data);
      setWorldGenerationData(readWorldGenerationData);
      setWorldControllerData(readWorldControllerData);
      setWaterData(readWorldControllerData.waterData)
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
      setData(fileReader.result as string);
      if (worldController) {
        const [readWorldControllerData, readWorldGenerationData]  = loadSavedWorldAndResumeRun(worldController, fileReader.result as string);
        setWorldGenerationData(readWorldGenerationData);
        setWorldControllerData(readWorldControllerData);
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
        value={data}
        onChange={(e) => setData(e.target.value)}
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
