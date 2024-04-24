"use client";

import Button from "@/components/global/Button";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { worldControllerAtom } from "../../store";
import {
        mapDesignerFullscreenAtom,
        mapDesignerObjectsAtom,
        mapDesignerWorldSizeAtom,
} from "../../store/mapDesignerAtoms";
import { BsArrowsFullscreen, BsFullscreenExit } from "react-icons/bs";
import { FaTrash } from "react-icons/fa";
import { TfiCheckBox } from "react-icons/tfi";
import {  worldGenerationDataAtom,
          worldControllerDataAtom
        } from "../../store";
import worldControllerInitialValuesHotChange from "@/simulation/world/worldControllerInitialValuesHotChange";


export default function MapDesignerHeader() {
  const worldController = useAtomValue(worldControllerAtom);

  const setWorldSize = useSetAtom(mapDesignerWorldSizeAtom);
  const [mapDesignerObjects, setObjects] = useAtom(mapDesignerObjectsAtom);
  const [isFullscreen, setIsFullscreen] = useAtom(mapDesignerFullscreenAtom);

  const worldGenerationsData = useAtomValue(worldGenerationDataAtom);
  const [worldControllerData, setWorldControllerData] = useAtom(worldControllerDataAtom);
  
  // Button "Use Map": set objects in worldController and resume, store also in atom for further initializations
  const handleUseMap = () => {
    if (worldController) {
      worldControllerData.worldObjects = [...mapDesignerObjects.map((obj) => obj.clone())];
      setWorldControllerData(worldControllerData);
      worldControllerInitialValuesHotChange(worldController, worldControllerData, worldGenerationsData );
    }
    else {
      throw new Error ("worldController not found");
    }
  };

  const handleResetToWorldControllerMap = () => {
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
      <Button onClick={handleResetToWorldControllerMap} icon={<FaTrash />}>
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
