import WorldObject from "@/simulation/world/WorldObject";
import { Coordinates } from "./coordinates";

export const HANDLE_SIZE = 10;

export function getHandles(obj: WorldObject): Coordinates[] {
  const normalizedHandles = [
    { x: obj.x, y: obj.y },
    { x: obj.x + obj.width, y: obj.y },
    { x: obj.x + obj.width, y: obj.y + obj.height },
    { x: obj.x, y: obj.y + obj.height },
  ];
  return normalizedHandles;
}

export function areCoordinatesInsideObject(
  coordinates: Coordinates,
  obj: WorldObject
) {
  return (
    coordinates.x >= obj.x &&
    coordinates.x <= obj.x + obj.width &&
    coordinates.y >= obj.y &&
    coordinates.y <= obj.y + obj.height
  );
}

export function drawOutline(
  context: CanvasRenderingContext2D,
  obj: WorldObject
) {
  context.strokeStyle = "black";
  context.lineWidth = 3;
  context.beginPath();
  context.rect(
    context.canvas.width * obj.x,
    context.canvas.height * obj.y,
    context.canvas.width * obj.width,
    context.canvas.height * obj.height
  );
  context.stroke();

  // Handles
  const normalizedHandles = getHandles(obj);
  normalizedHandles.forEach((handle) => {
    context.fillStyle = "white";
    context.beginPath();
    context.rect(
      context.canvas.width * handle.x - HANDLE_SIZE / 2,
      context.canvas.height * handle.y - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE
    );
    context.stroke();
    context.fill();
  });
}
