"use client";

import { useCallback, useEffect, useRef } from "react";
import { worldControllerAtom } from "../../store";
import { useAtom, useAtomValue } from "jotai";
import { useWindowSize } from "react-use";
import {
  mapDesignerObjectsAtom,
  mapDesignerWorldSizeAtom,
  mapDesignerSelectedObjectIndexAtom,
  mapDesignerFullscreenAtom,
} from "../../store/mapDesignerAtoms";
import useMouseClickAndDrag from "@/hooks/useMouseClickAndDrag";
import { Coordinates, roundCoordinates } from "@/helpers/coordinates";
import {
  HANDLE_SIZE,
  areCoordinatesInsideObject,
  drawOutline,
  getHandles,
} from "@/helpers/worldObjects";

export default function MapDesignerCanvas() {
  const worldController = useAtomValue(worldControllerAtom);
  const canvas = useRef<HTMLCanvasElement>(null);
  const isFullscreen = useAtomValue(mapDesignerFullscreenAtom);

  const { width } = useWindowSize();
  const worldSize = useAtomValue(mapDesignerWorldSizeAtom);
  const [objects, setObjects] = useAtom(mapDesignerObjectsAtom);
  const [selectedObjectIndex, setSelectedObjectIndex] = useAtom(
    mapDesignerSelectedObjectIndexAtom
  );
  const selectedObject =
    selectedObjectIndex != undefined ? objects[selectedObjectIndex] : undefined;

  // The object being dragged: the handle (undefined to move it), and where the
  // mouse and the object were when the drag started
  const drag = useRef<
    | { handle: number | undefined; startMouse: Coordinates; startTarget: Coordinates }
    | undefined
  >(undefined);

  // Draw the objects, outlines and handles
  const draw = useCallback(() => {
    if (canvas.current) {
      // Update size
      canvas.current.width = canvas.current.clientWidth;
      canvas.current.height = canvas.current.clientHeight;

      // Get the canvas' context
      const context = canvas.current.getContext("2d")!;

      // Draw every object
      objects.forEach((obj) => {
        obj.computePixels(worldSize);
        obj.draw(context, worldSize);
      });

      // Draw outlines
      objects.forEach((obj, index) => {
        if (index === selectedObjectIndex) drawOutline(context, obj);
      });
    }
  }, [objects, selectedObjectIndex, worldSize]);

  // the objects are atom state: apply the change to a clone of the selected one
  const updateSelectedObject = (x: number, y: number, width: number, height: number) => {
    setObjects((value) =>
      value.map((obj, index) => {
        const copy = obj.clone();
        if (index === selectedObjectIndex) {
          copy.x = x;
          copy.y = y;
          copy.width = width;
          copy.height = height;
        }
        return copy;
      })
    );
  };

  const onDragStart = (mousePosition: Coordinates) => {
    if (!selectedObject || !canvas.current) return;

    // Check if mouse is inside a handle
    let targetHandle: undefined | number = undefined;
    const normalizedHandles = getHandles(selectedObject);
    const handleNormalizedSize = HANDLE_SIZE / canvas.current.width;
    for (let index = 0; index < normalizedHandles.length; index++) {
      const handle = normalizedHandles[index];
      const xDistance = Math.abs(mousePosition.x - handle.x);
      const yDistance = Math.abs(mousePosition.y - handle.y);

      if (xDistance < handleNormalizedSize && yDistance < handleNormalizedSize) {
        targetHandle = index;
        break;
      }
    }

    if (
      targetHandle != undefined ||
      areCoordinatesInsideObject(mousePosition, selectedObject)
    ) {
      // Save the start position of the mouse and the object
      drag.current = {
        handle: targetHandle,
        startMouse: { x: mousePosition.x, y: mousePosition.y },
        startTarget: { x: selectedObject.x, y: selectedObject.y },
      };
    }
  };

  const onDrag = (normalizedMousePosition: Coordinates) => {
    if (!drag.current || !selectedObject) return;
    const { handle, startMouse, startTarget } = drag.current;

    if (handle != undefined) {
      // Resize the object: the handle follows the mouse, the opposite corner stays
      const mousePosition = roundCoordinates(normalizedMousePosition, worldSize);
      const normalizedHandles = getHandles(selectedObject);

      let anchor1 = { x: 0, y: 0 };
      let anchor2 = { x: 0, y: 0 };

      if (handle === 0) {
        anchor1 = { x: mousePosition.x, y: mousePosition.y };
        anchor2 = { x: normalizedHandles[2].x, y: normalizedHandles[2].y };
      } else if (handle === 1) {
        anchor1 = { x: normalizedHandles[0].x, y: mousePosition.y };
        anchor2 = { x: mousePosition.x, y: normalizedHandles[2].y };
      } else if (handle === 2) {
        anchor1 = { x: normalizedHandles[0].x, y: normalizedHandles[0].y };
        anchor2 = { x: mousePosition.x, y: mousePosition.y };
      } else if (handle === 3) {
        anchor1 = { x: mousePosition.x, y: normalizedHandles[0].y };
        anchor2 = { x: normalizedHandles[2].x, y: mousePosition.y };
      }

      const newSize = { x: anchor2.x - anchor1.x, y: anchor2.y - anchor1.y };

      if (
        selectedObject.x !== anchor1.x ||
        selectedObject.y !== anchor1.y ||
        selectedObject.width !== newSize.x ||
        selectedObject.height !== newSize.y
      ) {
        updateSelectedObject(anchor1.x, anchor1.y, newSize.x, newSize.y);
      }
    } else {
      // Move the object
      const mousePosition = roundCoordinates(
        {
          x: startTarget.x + (normalizedMousePosition.x - startMouse.x),
          y: startTarget.y + (normalizedMousePosition.y - startMouse.y),
        },
        worldSize
      );

      // Only apply it if there were any change
      if (selectedObject.x !== mousePosition.x || selectedObject.y !== mousePosition.y) {
        updateSelectedObject(
          mousePosition.x,
          mousePosition.y,
          selectedObject.width,
          selectedObject.height
        );
      }
    }
  };

  const onDragEnd = () => {
    drag.current = undefined;
  };

  // Select the top object under the mouse, other than the selected one
  const onClick = (normalizedMousePosition: Coordinates) => {
    const reversedObjects = [...objects].reverse();
    for (let index = 0; index < reversedObjects.length; index++) {
      const obj = reversedObjects[index];

      if (
        obj !== selectedObject &&
        areCoordinatesInsideObject(normalizedMousePosition, obj)
      ) {
        setSelectedObjectIndex(objects.indexOf(obj));
        break;
      }
    }
  };

  // Mouse interaction
  const { events } = useMouseClickAndDrag(canvas, {
    onClick,
    onDragStart,
    onDrag,
    onDragEnd,
  });

  // Draw the map
  useEffect(() => {
    draw();
  }, [draw, worldController, width, isFullscreen]);

  return (
    <canvas
      className="aspect-square w-full bg-white lg:col-span-2"
      ref={canvas}
      {...events}
    ></canvas>
  );
}
