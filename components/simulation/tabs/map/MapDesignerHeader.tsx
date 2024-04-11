"use client";

import Button from "@/components/global/Button";
import { useAtom, useAtomValue } from "jotai";
import { worldControllerAtom } from "../../store";
import {
  mapDesignerFullscreenAtom,
  mapDesignerObjectsAtom,
  mapDesignerWorldSizeAtom,
} from "../../store/mapDesignerAtoms";
import { BsArrowsFullscreen, BsFullscreenExit } from "react-icons/bs";
import { FaTrash } from "react-icons/fa";
import { TfiCheckBox } from "react-icons/tfi";
import {worldObjectsAtom} from "../../store";

export default function MapDesignerHeader() {
  const worldController = useAtomValue(worldControllerAtom);

  const [worldSize, setWorldSize] = useAtom(mapDesignerWorldSizeAtom);
  const [objects, setObjects] = useAtom(mapDesignerObjectsAtom);
  const [isFullscreen, setIsFullscreen] = useAtom(mapDesignerFullscreenAtom);

  const [setWorldObjects, setWorldObjectsAtom] = useAtom(worldObjectsAtom);
  
  // Button "Use Map": set objects in worldController and initialize, store also in atom for further initializations
  const handleUse = () => {
    if (worldController) {
      const isPaused = worldController.isPaused;
      worldController.objects = objects.map((obj) => obj.clone());
      worldController.startRun();
      setWorldObjectsAtom(worldController.objects);

      if (!isPaused) {
        worldController.startRun();
      }
    }
  };

  const handleReset = () => {
    if (worldController) {
      setWorldSize(worldController.size);
      setObjects(worldController.objects.map((obj) => obj.clone()));
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="flex items-center justify-start gap-2">
      <Button variant="grey" onClick={handleUse} icon={<TfiCheckBox />}>
        Use Map
      </Button>
      <Button onClick={handleReset} icon={<FaTrash />}>
        Reset Designer
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
