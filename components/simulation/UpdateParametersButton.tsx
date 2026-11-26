"use client";

import Button from "../global/Button";
import { useAtomValue } from "jotai";
import { worldControllerAtom, simulationDataAtom } from "./store";
import worldControllerSimDataHotChange from "@/simulation/world/worldControllerSimDataHotChange";
import { checkWaterSettings } from "@/simulation/water/checkWaterSettings";

export default function UpdateParametersButton() {
  const worldController = useAtomValue(worldControllerAtom);
  const simulationData = useAtomValue(simulationDataAtom);
  // the restored creatures also take their mass from the cloud; the Water section says why
  const waterError = checkWaterSettings(simulationData).errors[0];

  //TODO canvas size hot change could lead to unknown results
  
  const handleClick = () => {
    if (worldController) {
      worldControllerSimDataHotChange(worldController, simulationData);
    } else {
      console.warn("UpdateParametersButton worldController not found!")
    }

  };

  return (
    <Button variant="primary" disabled={waterError !== undefined}
      title={waterError ? `Cannot update: ${waterError}` : undefined} onClick={handleClick}>
      Update simulation
    </Button>
  );
}
