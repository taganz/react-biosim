"use client";

import React from "react";
import Button from "../global/Button";
import { useSetAtom, useAtomValue } from "jotai";
import { worldControllerAtom, worldGenerationDataAtom, worldControllerDataAtom } from "./store";

export default function RestartButton() {
  //const restart = useSetAtom(restartAtom);
  const worldController = useAtomValue(worldControllerAtom);
  const worldControllerData = useAtomValue(worldControllerDataAtom);
  const worldGenerationsData = useAtomValue(worldGenerationDataAtom);

  const handleClick = () => {
    if (worldController) {
      worldController?.startRun(worldControllerData, worldGenerationsData);
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
