"use client";

import React from "react";
import { useAtomValue } from "jotai";
import Button from "../global/Button";
import { worldControllerAtom } from "./store";

export default function PlayPauseButton() {
  const worldController = useAtomValue(worldControllerAtom);

  const handleClick = () => {
    if (worldController) {
      worldController.isPaused ? worldController.resume() : worldController.pause();
    } else {
      throw new Error ("worldController not found");
    }

  };

  return (
    <Button variant="dark" onClick={handleClick}>
      {!worldController ? "Initializing..." : (worldController.isPaused ? "Play" : "Pause")}
    </Button>
  );
}
