import { useCallback, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { simulationDataAtom, worldControllerAtom } from "@/components/simulation/store";
import { loadSavedSimulationAndStartRun, loadSavedWorldAndResumeRun } from "@/simulation/world/loadWorld";

export type LoadStatus =
  | { state: "idle" }
  | { state: "loading" | "success" | "error"; message: string };

// startRun: start the saved simulation from generation 1, resumeRun: continue from the saved generation
export type LoadAction = "startRun" | "resumeRun";

function describeError(error: unknown): string {
  if (error instanceof SyntaxError) return "it is not a valid simulation file (invalid JSON).";
  if (error instanceof Error) return error.message;
  return String(error);
}

// Loads a saved simulation into the running WorldController and reports progress and errors
export default function useSimulationLoader() {
  const worldController = useAtomValue(worldControllerAtom);
  const setSimulationData = useSetAtom(simulationDataAtom);
  const [status, setStatus] = useState<LoadStatus>({ state: "idle" });
  // only the latest request may change the simulation, in case the user picks another file while one is loading
  const lastRequest = useRef(0);

  const load = useCallback(
    async (readText: () => Promise<string>, action: LoadAction, sourceName: string) => {
      if (!worldController) {
        setStatus({ state: "error", message: "The simulation is not ready yet, try again in a moment." });
        return;
      }

      const request = ++lastRequest.current;
      setStatus({ state: "loading", message: `Loading ${sourceName}…` });

      try {
        const text = await readText();
        if (request !== lastRequest.current) return;

        const simulationData =
          action === "startRun"
            ? loadSavedSimulationAndStartRun(worldController, text)
            : loadSavedWorldAndResumeRun(worldController, text);
        setSimulationData(simulationData);

        setStatus({
          state: "success",
          message:
            action === "startRun"
              ? `Loaded ${sourceName}.`
              : `Loaded ${sourceName} at generation ${simulationData.worldControllerData.currentGen}.`,
        });
      } catch (error) {
        if (request !== lastRequest.current) return;
        console.error(`Error loading ${sourceName}:`, error);
        setStatus({ state: "error", message: `Could not load ${sourceName}: ${describeError(error)}` });
      }
    },
    [worldController, setSimulationData]
  );

  return { status, load };
}
