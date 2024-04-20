"use client";

import Button from "@/components/global/Button";
import { worldControllerAtom, worldGenerationDataAtom } from "../../store";
import { useAtomValue } from "jotai";
import CopyToClipboardTextarea from "@/components/global/inputs/CopyToClipboardTextarea";
import { useState } from "react";
import { saveWorld } from "@/simulation/serialization/saveWorld";
import { saveAs } from "file-saver";
import CanvasToGIF from "./CanvasToGif";

export default function SavePanel() {
  const worldController = useAtomValue(worldControllerAtom);
  const worldGenerationsData = useAtomValue(worldGenerationDataAtom);
  const [dataSavedWorld, setDataSavedWorld] = useState("");

  const handleSave = () => {
    if (worldController) {
      const savedWorld = saveWorld(worldController);
      const jsonSavedWorld = JSON.stringify(savedWorld);
      setDataSavedWorld(jsonSavedWorld);
    }
  };


  const handleSaveToFile = () => {
    if (worldController) {
      const savedWorld = saveWorld(worldController);
      const jsonSavedWorld = JSON.stringify(savedWorld);
      setDataSavedWorld(jsonSavedWorld);

      const blob = new Blob ([jsonSavedWorld]  , { type: 'text/plain;charset=utf-8'})
      saveAs( blob, 'sim_generation '.concat(worldController.currentGen.toString()) ); 
    }
  };

  return (
    <div>
      <p className="mb-2">
        Press the &quot;Save&quot; button below to generate a JSON code of worldController
        that you can back up somewhere else! If you want to load it, use the
        &quot;Load&quot; tab.
      </p>

      <CopyToClipboardTextarea
        value={dataSavedWorld}
        maxRows={20}
        minRows={20}
        withScrollbar
      />
      {/*div className="mt-2 text-center">*/}
      <div  className="mt-2">
        <br/>
        <p>Display current simulation state for copy</p>
        <Button onClick={handleSave}>Save to copy</Button>
        <br/>
        <h3 className="mb-1 text-xl font-bold">Beta options</h3>
        <br/>
        <p>Save current simulation state</p>
        <Button onClick={handleSaveToFile}>Save to file</Button>
        <CanvasToGIF></CanvasToGIF>
      </div>
    </div>
  );
}
