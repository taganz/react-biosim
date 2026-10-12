import { Coordinates } from "@/helpers/coordinates";
import { getEventRelativeMousePosition } from "@/helpers/mouse";
import { MouseEvent, useRef } from "react";

// Positions passed to the callbacks are normalized (0 - 1) to the element
interface Callbacks {
  onClick?: (position: Coordinates) => void;
  // called once the mouse moves more than 6px with the button down;
  // position is where the button was pressed
  onDragStart?: (position: Coordinates) => void;
  onDrag?: (position: Coordinates) => void;
  onDragEnd?: () => void;
}

export default function useMouseClickAndDrag(
  element: React.RefObject<HTMLElement | null>,
  { onClick, onDragStart, onDrag, onDragEnd }: Callbacks
) {
  const isMouseDown = useRef(false);
  const isDragging = useRef(false);
  // in pixels, to measure the distance to the first click
  const pixelPositionWhenClicked = useRef<Coordinates>({ x: 0, y: 0 });
  const normalizedPositionWhenClicked = useRef<Coordinates>({ x: 0, y: 0 });

  const onPointerMove = (e: MouseEvent) => {
    if (!element.current) return;
    e.preventDefault();

    if (!isMouseDown.current) return;
    const normalizedPosition = getEventRelativeMousePosition(element.current, e, true);

    if (!isDragging.current) {
      // Get position in pixels
      const position = getEventRelativeMousePosition(element.current, e, false);

      // Measure the distance to the fist click
      const distanceFromFirstClick = Math.sqrt(
        Math.pow(position.x - pixelPositionWhenClicked.current.x, 2) +
          Math.pow(position.y - pixelPositionWhenClicked.current.y, 2)
      );
      if (distanceFromFirstClick <= 6) return;

      isDragging.current = true;
      onDragStart?.(normalizedPositionWhenClicked.current);
    }
    onDrag?.(normalizedPosition);
  };

  const onPointerDown = (e: MouseEvent) => {
    if (!element.current) return;
    e.preventDefault();

    isMouseDown.current = true;
    pixelPositionWhenClicked.current = getEventRelativeMousePosition(element.current, e, false);
    normalizedPositionWhenClicked.current = getEventRelativeMousePosition(element.current, e, true);
  };

  const onPointerUp = (e: MouseEvent) => {
    if (!element.current) return;
    e.preventDefault();

    if (isDragging.current) {
      onDragEnd?.();
    } else if (isMouseDown.current) {
      onClick?.(getEventRelativeMousePosition(element.current, e, true));
    }

    isMouseDown.current = false;
    isDragging.current = false;
  };

  return {
    events: {
      onPointerMove,
      onPointerDown,
      onPointerUp,
    },
  };
}
