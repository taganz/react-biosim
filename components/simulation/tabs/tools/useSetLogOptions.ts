"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { simulationDataAtom, worldControllerAtom } from "../../store";
import { LogOptions } from "@/simulation/logger/EventLogger";

// Changes logger settings (LOG_* constants). They apply at once to the running simulation,
// and to the Settings draft so that Update simulation and Restart keep them.
export default function useSetLogOptions() {
  const worldController = useAtomValue(worldControllerAtom);
  const setSimulationData = useSetAtom(simulationDataAtom);

  return (options: Partial<LogOptions>) => {
    if (!worldController) return;
    const previous = worldController.simData;
    const updated = worldController.setLogOptions(options);
    // with no pending changes the draft is the running simData, and it stays so
    setSimulationData((prev) =>
      prev === previous ? updated : { ...prev, constants: { ...prev.constants, ...options } }
    );
  };
}
