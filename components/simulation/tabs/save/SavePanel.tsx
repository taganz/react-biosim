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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p>
          Save the current simulation state to load it later with &quot;Load&quot; below,
          or show it as JSON code to copy somewhere else.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSaveToFile}>Save to file</Button>
          <Button onClick={handleSave}>Show JSON to copy</Button>
        </div>
        {dataSavedWorld && (
          <CopyToClipboardTextarea
            value={dataSavedWorld}
            maxRows={20}
            minRows={5}
            withScrollbar
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold">Images and GIFs</h3>
        <CanvasToGIF></CanvasToGIF>
      </div>
    </div>
  );
}
