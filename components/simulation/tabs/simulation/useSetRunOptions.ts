"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { simulationDataAtom, worldControllerAtom } from "../../store";
import { RunOptions } from "@/simulation/world/WorldController";

// Changes the Simulation tab options. They apply at once to the running simulation,
// and to the Scenario draft so that Update simulation and Restart keep them.
export default function useSetRunOptions() {
  const worldController = useAtomValue(worldControllerAtom);
  const setSimulationData = useSetAtom(simulationDataAtom);

  return (options: RunOptions) => {
    if (!worldController) return;
    const previous = worldController.simData;
    const updated = worldController.setRunOptions(options);
    // with no pending changes the draft is the running simData, and it stays so
    setSimulationData((prev) =>
      prev === previous ? updated : {
        ...prev,
        worldControllerData: {
          ...prev.worldControllerData,
          simCode: updated.worldControllerData.simCode,
          seed: updated.worldControllerData.seed,
        },
        worldGenerationsData: {
          ...prev.worldGenerationsData,
          phenotypeColorMode: updated.worldGenerationsData.phenotypeColorMode,
        },
      }
    );
  };
}
