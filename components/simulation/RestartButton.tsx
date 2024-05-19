"use client";

import React from "react";
import Button from "../global/Button";
import { useAtom, useAtomValue } from "jotai";
import { simulationDataAtom, worldControllerAtom, worldCanvasAtom} from "./store";

export default function RestartButton() {
  //const restart = useSetAtom(restartAtom);
  const worldController = useAtomValue(worldControllerAtom);
  const simulationData = useAtomValue(simulationDataAtom);

  const handleClick = () => {
    if (worldController) {
      const simCode = worldController?.startRun(simulationData);
    } else {
      console.warn("RestartButton worldController or worldCanvas not found!")
    }

  };

  return (
    <Button variant="danger" onClick={handleClick}>
      Restart
    </Button>
  );
}
