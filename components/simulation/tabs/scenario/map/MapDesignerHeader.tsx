"use client";

import Button from "@/components/global/Button";
import { useAtom, useSetAtom } from "jotai";
import {
  mapDesignerFullscreenAtom,
  mapDesignerObjectsAtom,
  mapDesignerSelectedObjectIndexAtom,
} from "../../../store/mapDesignerAtoms";
import { BsArrowsFullscreen, BsFullscreenExit } from "react-icons/bs";
import { FaTrash, FaUndo } from "react-icons/fa";
import useWorldValue from "@/hooks/useWorldValue";
import { simulationDataAtom } from "../../../store";
import { SimulationData } from "@/simulation/SimulationData";

// true if the draft only differs from the running simulation in its map
const onlyMapDiffers = (draft: SimulationData, running: SimulationData) =>
  (Object.keys(running) as (keyof SimulationData)[]).every(
    (key) => key === "worldObjects" || draft[key] === running[key]
  ) && Object.keys(draft).length === Object.keys(running).length;

export default function MapDesignerHeader() {
  const setObjects = useSetAtom(mapDesignerObjectsAtom);
  const setSimulationData = useSetAtom(simulationDataAtom);
  const setSelectedIndex = useSetAtom(mapDesignerSelectedObjectIndexAtom);
  const [isFullscreen, setIsFullscreen] = useAtom(mapDesignerFullscreenAtom);
  const running = useWorldValue((world) => world.simData, null);

  // "Reset map": back to the map of the running simulation, keeping the other draft changes.
  // The designer clones objects before changing them, so the draft can share them.
  const handleReset = () => {
    if (!running) return;
    // with no other changes the draft is the running simData again, so nothing is pending
    setSimulationData((draft) =>
      onlyMapDiffers(draft, running) ? running : { ...draft, worldObjects: running.worldObjects }
    );
    setSelectedIndex(undefined);
  };

  const handleClear = () => {
    setObjects([]);
    setSelectedIndex(undefined);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="flex items-center justify-start gap-2">
      <Button variant="grey" onClick={handleReset} icon={<FaUndo />}>
        Reset map
      </Button>
      <Button variant="danger" onClick={handleClear} icon={<FaTrash />}>
        Clear map
      </Button>

      <Button
        onClick={handleFullscreen}
        className="ml-auto"
        icon={isFullscreen ? <BsFullscreenExit /> : <BsArrowsFullscreen />}
        variant="grey"
      ></Button>
    </div>
  );
}
