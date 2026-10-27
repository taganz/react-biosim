"use client";

import Button from "@/components/global/Button";
import { simulationDataAtom, worldControllerAtom } from "../../store";
import { useAtomValue } from "jotai";
import CheckboxInput from "@/components/global/inputs/CheckboxInput";
import type WorldController from "@/simulation/world/WorldController";
import CopyToClipboardTextarea from "@/components/global/inputs/CopyToClipboardTextarea";
import StatusMessage from "@/components/global/StatusMessage";
import { LoadStatus } from "@/hooks/useSimulationLoader";
import { useState } from "react";
import { saveAs } from "file-saver";
import CanvasToGIF from "./CanvasToGif";
import { SavedSimulationData } from "@/simulation/serialization/data/SavedSimulationData";
import { serializeSimulationData } from "@/simulation/serialization/formatters/simulationDataSerialization";

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function SavePanel() {
  const simulationData = useAtomValue(simulationDataAtom);
  const worldController = useAtomValue(worldControllerAtom);
  const [dataSavedWorld, setDataSavedWorld] = useState("");
  const [includeStats, setIncludeStats] = useState(false);
  const [status, setStatus] = useState<LoadStatus>({ state: "idle" });

  const toJson = (worldController: WorldController, prettify: boolean) => {
    const savedWorld : SavedSimulationData = serializeSimulationData(worldController, includeStats);
    return prettify ? JSON.stringify(savedWorld, null, 2) : JSON.stringify(savedWorld);
  };

  // during the pause between generations, or the wait after an extinction, the world is half way:
  // wait until it is between two steps, then save
  const whenBetweenSteps = async (worldController: WorldController) => {
    if (worldController.isWaiting) {
      setStatus({ state: "loading", message: "Waiting for the next generation to start…" });
      await worldController.untilBetweenSteps();
    }
  };

  const handleSave = async () => {
    if (!worldController) return;
    try {
      await whenBetweenSteps(worldController);
      setDataSavedWorld(toJson(worldController, simulationData.constants.PRETTIFY_OUTPUT_TO_COPY));
      setStatus({ state: "idle" });
    } catch (error) {
      setStatus({ state: "error", message: `Could not save the simulation: ${describeError(error)}` });
    }
  };

  const handleSaveToFile = async () => {
    if (!worldController) return;
    try {
      await whenBetweenSteps(worldController);
      const jsonSavedWorld = toJson(worldController, simulationData.constants.PRETTIFY_OUTPUT_TO_FILE);
      // the file is not shown: a long run is several MB, and any JSON shown before is now out of date
      setDataSavedWorld("");

      const fileName = `sim ${worldController.simCode} generation ${worldController.currentGen.toString()}.sim`;
      const blob = new Blob([jsonSavedWorld], { type: "application/json;charset=utf-8" });
      saveAs(blob, fileName);
      setStatus({ state: "success", message: `Saved "${fileName}".` });
    } catch (error) {
      setStatus({ state: "error", message: `Could not save the simulation: ${describeError(error)}` });
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
        <StatusMessage status={status} />
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
