"use client";

import React from "react";
import Button from "../global/Button";
import { FaRedo } from "react-icons/fa";
import { useAtom, useAtomValue } from "jotai";
import { simulationDataAtom, worldControllerAtom, worldCanvasAtom} from "./store";

interface Props {
  // icon only on narrow screens, for the control bar
  compact?: boolean;
}

export default function RestartButton({ compact = false }: Props) {
  //const restart = useSetAtom(restartAtom);
  const worldController = useAtomValue(worldControllerAtom);
  const simulationData = useAtomValue(simulationDataAtom);

  const handleClick = () => {
    if (!worldController) {
      console.warn("RestartButton worldController not found!");
      return;
    }
    // restarting loses all the evolution so far, which can be hours of simulation
    const confirmed = window.confirm(
      `Restart the simulation from generation 1?\n\n` +
        `The current evolution (generation ${worldController.currentGen}) will be lost. ` +
        `Save it first in the Files tab if you want to keep it.`
    );
    if (confirmed) {
      // keep the code only if it was changed in Settings; otherwise this is a new run with a new code
      const draftCode = simulationData.worldControllerData.simCode;
      worldController.startRun(simulationData, draftCode !== worldController.simCode ? draftCode : undefined);
    }
  };

  return (
    <Button variant="danger" icon={<FaRedo />} aria-label="Restart" title="Restart" onClick={handleClick}>
      {compact ? <span className="hidden sm:inline">Restart</span> : "Restart"}
    </Button>
  );
}
