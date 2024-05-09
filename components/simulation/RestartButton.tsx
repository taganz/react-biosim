"use client";

import React from "react";
import Button from "../global/Button";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { worldControllerAtom, worldGenerationDataAtom, worldControllerDataAtom, worldCanvasAtom } from "./store";

export default function RestartButton() {
  //const restart = useSetAtom(restartAtom);
  const worldController = useAtomValue(worldControllerAtom);
  const [worldControllerData, setWorldControllerData] = useAtom(worldControllerDataAtom);
  const worldGenerationsData = useAtomValue(worldGenerationDataAtom);
  const worldCanvas = useAtomValue(worldCanvasAtom);

  const handleClick = () => {
    if (worldController && worldCanvas) {
      const simCode = worldController?.startRun(worldControllerData, worldGenerationsData);
      setWorldControllerData({...worldControllerData, simCode : simCode});
      worldCanvas.size = worldControllerData.size;
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
