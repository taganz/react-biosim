"use client";

import Button from "@/components/global/Button";
import { useAtom, useAtomValue } from "jotai";
import { worldAtom } from "../../store";
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
  const world = useAtomValue(worldAtom);

  const [worldSize, setWorldSize] = useAtom(mapDesignerWorldSizeAtom);
  const [objects, setObjects] = useAtom(mapDesignerObjectsAtom);
  const [isFullscreen, setIsFullscreen] = useAtom(mapDesignerFullscreenAtom);

  const [setWorldObjects, setWorldObjectsAtom] = useAtom(worldObjectsAtom);
  
  //RD set objects in world and initialize, store also in atom for further initializations
  const handleUse = () => {
    if (world) {
      const isPaused = world.isPaused;
      world.size = worldSize;
      world.objects = objects.map((obj) => obj.clone());
      world.initializeWorld(true);
      setWorldObjectsAtom(world.objects);

      if (!isPaused) {
        world.startRun();
      }
    }
  };

  const handleReset = () => {
    if (world) {
      setWorldSize(world.size);
      setObjects(world.objects.map((obj) => obj.clone()));
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
