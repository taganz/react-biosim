import { Coordinates } from "@/helpers/coordinates";
import { getEventRelativeMousePosition } from "@/helpers/mouse";
import { MouseEvent, useEffect, useState } from "react";

export default function useMouseClickAndDrag(
  element: React.RefObject<HTMLElement | null>
) {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mousePositionWhenClicked, setNormalizedMouseWhenClicked] =
    useState<Coordinates>({
      x: 0,
      y: 0,
    });
  const [normalizedMousePosition, setNormalizedMousePosition] =
    useState<Coordinates>({
      x: 0,
      y: 0,
    });
  const [isClicking, setIsClicking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerMove = (e: MouseEvent) => {
    if (!element.current) return;
    e.preventDefault();

    if (element.current) {
      // Get the normalized position
      const normalizedPosition = getEventRelativeMousePosition(
        element.current,
        e,
        true
      );
      setNormalizedMousePosition(normalizedPosition);

      if (isMouseDown) {
        // Get position in pixels
        const position = getEventRelativeMousePosition(
          element.current,
          e,
          false
        );

        // Measure the distance to the fist click
        const distanceFromFirstClick = Math.sqrt(
          Math.pow(position.x - mousePositionWhenClicked.x, 2) +
            Math.pow(position.y - mousePositionWhenClicked.y, 2)
        );

        if (distanceFromFirstClick > 6) {
          setIsDragging(true);
        }
      }
    }
  };

  const onPointerDown = (e: MouseEvent) => {
    if (!element.current) return;
    e.preventDefault();

    setIsMouseDown(true);
    const mousePosition = getEventRelativeMousePosition(element.current, e);
    setNormalizedMouseWhenClicked(mousePosition);
  };

  const onPointerUp = (e: MouseEvent) => {
    if (!element.current) return;
    e.preventDefault();

    if (!isDragging) {
      setIsClicking(true);
    }

    setIsMouseDown(false);
    setIsDragging(false);
  };

  useEffect(() => {
    setIsClicking(false);
  }, [isClicking]);

  return {
    isMouseDown,
    mousePositionWhenClicked,
    normalizedMousePosition,
    isClicking,
    isDragging,
    events: {
      onPointerMove,
      onPointerDown,
      onPointerUp,
    },
  };
}
