import { MouseEvent } from "react";
import { Coordinates } from "./coordinates";

export function getEventRelativeMousePosition(
  element: HTMLElement,
  e: MouseEvent,
  normalized?: boolean
) {
  const canvasRect = element.getBoundingClientRect();

  // Calculate the normalized mouse position relative to the element
  let x = e.clientX - canvasRect.left;
  let y = e.clientY - canvasRect.top;
  if (normalized) {
    x /= canvasRect.width;
    y /= canvasRect.height;
  }

  return { x, y } as Coordinates;
}
