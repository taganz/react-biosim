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

  // The object being dragged (by index, because selecting it only takes effect
  // on the next render), the handle (undefined to move it), and where the mouse
  // and the object were when the drag started
  const drag = useRef<
    | {
        index: number;
        handle: number | undefined;
        startMouse: Coordinates;
        startTarget: Coordinates;
      }
    | undefined
  >(undefined);

  // Indices of the objects under the mouse, top (drawn last) first
  const getObjectsAt = (position: Coordinates) =>
    objects
      .map((_, index) => index)
      .filter((index) => areCoordinatesInsideObject(position, objects[index]))
      .reverse();

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

  // the objects are atom state: apply the change to a clone of the dragged one
  const updateObject = (
    targetIndex: number,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    setObjects((value) =>
      value.map((obj, index) => {
        const copy = obj.clone();
        if (index === targetIndex) {
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
    if (!canvas.current) return;

    // Check if mouse is inside a handle of the selected object
    let targetHandle: undefined | number = undefined;
    if (selectedObject) {
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
    }

    // Drag the selected object if the mouse is on it or on a handle,
    // otherwise select and drag the top object under the mouse
    let targetIndex: number | undefined = undefined;
    if (
      selectedObjectIndex != undefined &&
      selectedObject &&
      (targetHandle != undefined ||
        areCoordinatesInsideObject(mousePosition, selectedObject))
    ) {
      targetIndex = selectedObjectIndex;
    } else {
      targetIndex = getObjectsAt(mousePosition)[0];
      if (targetIndex != undefined) setSelectedObjectIndex(targetIndex);
    }

    if (targetIndex != undefined) {
      // Save the start position of the mouse and the object
      const target = objects[targetIndex];
      drag.current = {
        index: targetIndex,
        handle: targetHandle,
        startMouse: { x: mousePosition.x, y: mousePosition.y },
        startTarget: { x: target.x, y: target.y },
      };
    }
  };

  const onDrag = (normalizedMousePosition: Coordinates) => {
    if (!drag.current) return;
    const { index, handle, startMouse, startTarget } = drag.current;
    const target = objects[index];
    if (!target) return;

    if (handle != undefined) {
      // Resize the object: the handle follows the mouse, the opposite corner stays
      const mousePosition = roundCoordinates(normalizedMousePosition, worldSize);
      const normalizedHandles = getHandles(target);

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
        target.x !== anchor1.x ||
        target.y !== anchor1.y ||
        target.width !== newSize.x ||
        target.height !== newSize.y
      ) {
        updateObject(index, anchor1.x, anchor1.y, newSize.x, newSize.y);
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
      if (target.x !== mousePosition.x || target.y !== mousePosition.y) {
        updateObject(index, mousePosition.x, mousePosition.y, target.width, target.height);
      }
    }
  };

  const onDragEnd = () => {
    drag.current = undefined;
  };

  // Select the top object under the mouse. Clicking the selected object again
  // selects the one below it, cycling through all the overlapping objects.
  // Clicking an empty spot clears the selection.
  const onClick = (normalizedMousePosition: Coordinates) => {
    const hits = getObjectsAt(normalizedMousePosition);
    if (hits.length === 0) {
      setSelectedObjectIndex(undefined);
      return;
    }

    const current = selectedObjectIndex != undefined ? hits.indexOf(selectedObjectIndex) : -1;
    setSelectedObjectIndex(hits[(current + 1) % hits.length]);
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
