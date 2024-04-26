"use client";

import React from "react";
import Button from "../global/Button";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { worldControllerAtom, worldGenerationDataAtom, worldControllerDataAtom } from "./store";

export default function RestartButton() {
  //const restart = useSetAtom(restartAtom);
  const worldController = useAtomValue(worldControllerAtom);
  const [worldControllerData, setWorldControllerData] = useAtom(worldControllerDataAtom);
  const worldGenerationsData = useAtomValue(worldGenerationDataAtom);

  const handleClick = () => {
    if (worldController) {
      const simCode = worldController?.startRun(worldControllerData, worldGenerationsData);
      setWorldControllerData({...worldControllerData, simCode : simCode});
    } else {
      console.warn("RestartButton worldController not found!")
    }

  };

  return (
    <Button variant="danger" onClick={handleClick}>
      Restart
    </Button>
  );
}
