"use client";

import React from "react";
import Button from "../global/Button";
import { useAtomValue } from "jotai";
import { worldControllerAtom, worldGenerationDataAtom, worldControllerDataAtom, waterDataAtom } from "./store";
import worldControllerInitialValuesHotChange from "@/simulation/world/worldControllerInitialValuesHotChange";

export default function UpdateParametersButton() {
  const worldController = useAtomValue(worldControllerAtom);
  const worldControllerData = useAtomValue(worldControllerDataAtom);
  const worldGenerationsData = useAtomValue(worldGenerationDataAtom);
  const waterData = useAtomValue(waterDataAtom);
  

  const handleClick = () => {
    if (worldController) {
      worldControllerInitialValuesHotChange(worldController, worldControllerData, worldGenerationsData, waterData );
    } else {
      console.warn("UpdateParametersButton worldController not found!")
    }

  };

  return (
    <Button variant="danger" onClick={handleClick}>
      Update simulation
    </Button>
  );
}
