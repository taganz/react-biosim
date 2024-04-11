"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  // Mouse interaction
  const { events, normalizedMousePosition, isClicking, isDragging } =
    useMouseClickAndDrag(canvas);

  // Mouse dragging
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [startDragMousePos, setStartDragMousePos] = useState<
    Coordinates | undefined
  >(undefined);
  const [startDragTargetPos, setStartDragTargetPos] = useState<
    Coordinates | undefined
  >(undefined);
  const [draggedHandle, setDraggedHandle] = useState<number | undefined>(
    undefined
  );

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

  const updateObjects = useCallback(() => {
    setObjects((value) => value.map((obj) => obj.clone()));
  }, [setObjects]);

  // Move objecs
  useEffect(() => {
    if (!canvas.current) return;

    let startedDragging = false;

    if (isDragging && selectedObject) {
      if (isDraggingObject) {
        if (!startDragMousePos || !startDragTargetPos) {
          // Save the start position of the mouse and the object
          setStartDragMousePos({
            x: normalizedMousePosition.x,
            y: normalizedMousePosition.y,
          });
          setStartDragTargetPos({ x: selectedObject.x, y: selectedObject.y });
        } else {
          if (draggedHandle != undefined) {
            const mousePosition = roundCoordinates(
              normalizedMousePosition,
              worldSize
            );
            const normalizedHandles = getHandles(selectedObject);

            let anchor1 = { x: 0, y: 0 };
            let anchor2 = { x: 0, y: 0 };

            if (draggedHandle === 0) {
              anchor1 = { x: mousePosition.x, y: mousePosition.y };
              anchor2 = {
                x: normalizedHandles[2].x,
                y: normalizedHandles[2].y,
              };
            } else if (draggedHandle === 1) {
              anchor1 = { x: normalizedHandles[0].x, y: mousePosition.y };
              anchor2 = { x: mousePosition.x, y: normalizedHandles[2].y };
            } else if (draggedHandle === 2) {
              anchor1 = {
                x: normalizedHandles[0].x,
                y: normalizedHandles[0].y,
              };
              anchor2 = { x: mousePosition.x, y: mousePosition.y };
            } else if (draggedHandle === 3) {
              anchor1 = { x: mousePosition.x, y: normalizedHandles[0].y };
              anchor2 = { x: normalizedHandles[2].x, y: mousePosition.y };
            }

            const newPosition = { x: anchor1.x, y: anchor1.y };
            const newSize = {
              x: anchor2.x - anchor1.x,
              y: anchor2.y - anchor1.y,
            };

            if (
              selectedObject.x !== newPosition.x ||
              selectedObject.y !== newPosition.y ||
              selectedObject.width !== newSize.x ||
              selectedObject.height !== newSize.y
            ) {
              selectedObject.x = newPosition.x;
              selectedObject.y = newPosition.y;
              selectedObject.width = newSize.x;
              selectedObject.height = newSize.y;
              updateObjects();
            }
          } else {
            const mousePosition = roundCoordinates(
              {
                x:
                  startDragTargetPos.x +
                  (normalizedMousePosition.x - startDragMousePos.x),
                y:
                  startDragTargetPos.y +
                  (normalizedMousePosition.y - startDragMousePos.y),
              },
              worldSize
            );

            if (
              selectedObject.x !== mousePosition.x ||
              selectedObject.y !== mousePosition.y
            ) {
              // Only apply it if there were any change
              selectedObject.x = mousePosition.x;
              selectedObject.y = mousePosition.y;
              updateObjects();
            }
          }
        }
      } else {
        // Check if mouse is inside a handle
        let targetHandle: undefined | number = undefined;
        const normalizedHandles = getHandles(selectedObject);
        const handleNormalizedSize = HANDLE_SIZE / canvas.current.width;
        for (let index = 0; index < normalizedHandles.length; index++) {
          const handle = normalizedHandles[index];
          const xDistance = Math.abs(normalizedMousePosition.x - handle.x);
          const yDistance = Math.abs(normalizedMousePosition.y - handle.y);

          if (
            xDistance < handleNormalizedSize &&
            yDistance < handleNormalizedSize
          ) {
            targetHandle = index;
            break;
          }
        }

        if (targetHandle != undefined) {
          setDraggedHandle(targetHandle);
          setIsDraggingObject(true);
          startedDragging = true;
        } else if (
          areCoordinatesInsideObject(normalizedMousePosition, selectedObject)
        ) {
          // Start dragging an object
          setIsDraggingObject(true);
          startedDragging = true;
        }
      }
    } else {
      setIsDraggingObject(false);
      setStartDragMousePos(undefined);
      setStartDragTargetPos(undefined);
      setDraggedHandle(undefined);
    }

    if (isClicking && !isDraggingObject && !startedDragging) {
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
    }
  }, [
    draggedHandle,
    isClicking,
    isDragging,
    isDraggingObject,
    normalizedMousePosition,
    objects,
    selectedObject,
    setSelectedObjectIndex,
    startDragMousePos,
    startDragTargetPos,
    updateObjects,
    worldSize,
  ]);

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
