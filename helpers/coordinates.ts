export type Coordinates = {
  x: number;
  y: number;
};

export function roundCoordinates(coordinates: Coordinates, worldSize: number) {
  return {
    x: Math.round(coordinates.x * worldSize) / worldSize,
    y: Math.round(coordinates.y * worldSize) / worldSize,
  };
}
