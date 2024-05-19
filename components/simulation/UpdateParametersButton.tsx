"use client";

import React from "react";
import Button from "../global/Button";
import { useAtomValue } from "jotai";
import { worldControllerAtom, simulationDataAtom } from "./store";
import worldControllerSimDataHotChange from "@/simulation/world/worldControllerSimDataHotChange";

export default function UpdateParametersButton() {
  const worldController = useAtomValue(worldControllerAtom);
  const simulationData = useAtomValue(simulationDataAtom);
  

  //TODO canvas size hot change could lead to unknown results
  
  const handleClick = () => {
    if (worldController) {
      worldControllerSimDataHotChange(worldController, simulationData);
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
