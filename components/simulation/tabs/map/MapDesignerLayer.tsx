"use client";

import WorldObject from "@/simulation/world/WorldObject";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { useWindowSize } from "react-use";
import {
  mapDesignerWorldSizeAtom,
  mapDesignerSelectedObjectIndexAtom,
  mapDesignerObjectsAtom,
} from "../../store/mapDesignerAtoms";
import classNames from "classnames";
import { AiOutlineCaretDown, AiOutlineCaretUp } from "react-icons/ai";

interface Props {
  index: number;
  obj: WorldObject;
}

const upDownButtonClassnames = "h-1/2 px-0.5 hover:brightness-75 bg-grey-mid";

export default function MapDesignerLayer({ index, obj }: Props) {
  const worldSize = useAtomValue(mapDesignerWorldSizeAtom);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [selectedObjectIndex, setSelectedObjectIndex] = useAtom(
    mapDesignerSelectedObjectIndexAtom
  );
  const [objects, setObjects] = useAtom(mapDesignerObjectsAtom);

  const draw = useCallback(() => {
    if (canvas.current) {
      // Update size
      canvas.current.width = canvas.current.clientWidth;
      canvas.current.height = canvas.current.clientHeight;

      const context = canvas.current.getContext("2d")!;
      obj.computePixels(worldSize);
      obj.draw(context, worldSize);
    }
  }, [obj, worldSize]);

  // Draw the map
  const { width } = useWindowSize();
  useEffect(() => {
    draw();
  }, [draw, width]);

  const handleClick = () => {
    setSelectedObjectIndex(index);
  };

  const handleMoveLayer = useCallback(
    (movement: 1 | -1) => {
      const newObjects = [...objects];
      const object = newObjects[index];
      newObjects.splice(index, 1);
      newObjects.splice(index + movement, 0, object);

      // Also move the selected index
      if (selectedObjectIndex === index) {
        setSelectedObjectIndex(selectedObjectIndex + movement);
      }

      setObjects(newObjects);
    },
    [index, objects, selectedObjectIndex, setObjects, setSelectedObjectIndex]
  );

  return (
    <div
      className={classNames(
        "relative overflow-hidden border-2 bg-grey-mid",
        selectedObjectIndex === index ? "border-white" : "border-transparent"
      )}
    >
      <button className="flex w-full items-center gap-2" onClick={handleClick}>
        <canvas className="aspect-square h-10 bg-white" ref={canvas}></canvas>

        <h4>{obj.name}</h4>
      </button>

      <div className="absolute right-0 top-0 flex h-full flex-col bg-grey-mid">
        {index > 0 && (
          <button
            className={upDownButtonClassnames}
            onClick={() => handleMoveLayer(-1)}
          >
            <AiOutlineCaretUp />
          </button>
        )}

        {index < objects.length - 1 && (
          <button
            className={upDownButtonClassnames}
            onClick={() => handleMoveLayer(1)}
          >
            <AiOutlineCaretDown />
          </button>
        )}
      </div>
    </div>
  );
}
