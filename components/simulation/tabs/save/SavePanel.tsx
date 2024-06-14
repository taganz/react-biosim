"use client";

import Button from "@/components/global/Button";
import { simulationDataAtom, worldControllerAtom } from "../../store";
import { useAtomValue } from "jotai";
import CopyToClipboardTextarea from "@/components/global/inputs/CopyToClipboardTextarea";
import { useState } from "react";
import { saveAs } from "file-saver";
import CanvasToGIF from "./CanvasToGif";
import { SavedSimulationData } from "@/simulation/serialization/data/SavedSimulationData";
import { serializeSimulationData } from "@/simulation/serialization/formatters/simulationDataSerialization";

export default function SavePanel() {
  const simulationData = useAtomValue(simulationDataAtom);
  const worldController = useAtomValue(worldControllerAtom);
  const [dataSavedWorld, setDataSavedWorld] = useState("");

  const handleSave = () => {
    if (worldController) {
      const savedWorld : SavedSimulationData = serializeSimulationData(worldController);
      if (simulationData.constants.PRETTIFY_OUTPUT_TO_COPY) {
        var jsonSavedWorld = JSON.stringify(savedWorld, null, 2);  // spacing level = 1
      } else {
        var jsonSavedWorld = JSON.stringify(savedWorld);
      }
      setDataSavedWorld(jsonSavedWorld);
    }
  };


  const handleSaveToFile = () => {
    if (worldController) {
      const savedWorld : SavedSimulationData = serializeSimulationData(worldController);
      if (simulationData.constants.PRETTIFY_OUTPUT_TO_FILE) {
        var jsonSavedWorld = JSON.stringify(savedWorld, null, 2);  // spacing level = 1
      } else {
        var jsonSavedWorld = JSON.stringify(savedWorld);
      }
      setDataSavedWorld(jsonSavedWorld);

      const blob = new Blob ([jsonSavedWorld]  , { type: 'text/plain;charset=utf-8'})
      saveAs( blob, `sim ${worldController.simCode} generation ${worldController.currentGen.toString()}.sim` ); 
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
        <p>Save current simulation state</p>
        <Button onClick={handleSaveToFile}>Save to file</Button>
        <CanvasToGIF></CanvasToGIF>
      </div>
    </div>
  );
}
