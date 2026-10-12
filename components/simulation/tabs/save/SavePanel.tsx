"use client";

import Button from "@/components/global/Button";
import { simulationDataAtom, worldControllerAtom } from "../../store";
import { useAtomValue } from "jotai";
import CheckboxInput from "@/components/global/inputs/CheckboxInput";
import type WorldController from "@/simulation/world/WorldController";
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
  const [includeStats, setIncludeStats] = useState(true);

  const toJson = (worldController: WorldController, prettify: boolean) => {
    const savedWorld : SavedSimulationData = serializeSimulationData(worldController, includeStats);
    return prettify ? JSON.stringify(savedWorld, null, 2) : JSON.stringify(savedWorld);
  };

  const handleSave = () => {
    if (worldController) {
      setDataSavedWorld(toJson(worldController, simulationData.constants.PRETTIFY_OUTPUT_TO_COPY));
    }
  };

  const handleSaveToFile = () => {
    if (worldController) {
      const jsonSavedWorld = toJson(worldController, simulationData.constants.PRETTIFY_OUTPUT_TO_FILE);
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
        <CheckboxInput
          id="save-include-stats"
          checked={includeStats}
          onChange={setIncludeStats}
          label="Include the stats history (larger for long runs)"
        />
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
