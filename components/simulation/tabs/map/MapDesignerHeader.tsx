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
import {  worldObjectsAtom,
          worldGenerationDataAtom,
          worldControllerDataAtom
        } from "../../store";

export default function MapDesignerHeader() {
  const worldController = useAtomValue(worldControllerAtom);

  const [worldSize, setWorldSize] = useAtom(mapDesignerWorldSizeAtom);
  const [mapDesignerObjects, setObjects] = useAtom(mapDesignerObjectsAtom);
  const [isFullscreen, setIsFullscreen] = useAtom(mapDesignerFullscreenAtom);

  const [setWorldObjects, setWorldObjectsAtom] = useAtom(worldObjectsAtom);
  const worldGenerationData = useAtomValue(worldGenerationDataAtom);
  const [worldControllerData, setWorldControllerData] = useAtom(worldControllerDataAtom);
  
  // Button "Use Map": set objects in worldController and initialize, store also in atom for further initializations
  const handleUseMap = () => {
    if (worldController) {
      const isPaused = worldController.isPaused;
      worldControllerData.worldObjects = [...mapDesignerObjects.map((obj) => obj.clone())];
      setWorldControllerData(worldControllerData);
      worldController.startRun(worldControllerData, worldGenerationData);
      if (isPaused) {
        worldController.pause();
      }
    }
    else {
      throw new Error ("worldController not found");
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
      <Button variant="grey" onClick={handleUseMap} icon={<TfiCheckBox />}>
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
