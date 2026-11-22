import type Creature from "@/simulation/creature/Creature";
import type { Grid, GridPosition } from "@/simulation/world/grid/Grid";
import type WorldObject from "@/simulation/world/objects/WorldObject";

/** The spawn areas of the map (areaType 2), in drawing order. A creature's spawnZone is an index in this list */
export function spawnAreas(grid: Grid): WorldObject[] {
  return grid.objects.filter((obj) => obj.areaType === 2);
}

/**
 * How many of `total` creatures go to each area, in proportion to the cells it covers. The rounding
 * goes to the largest remainders, ties to the area furthest back. No random numbers are drawn.
 */
export function countsByArea(areas: WorldObject[], total: number): number[] {
  if (areas.length === 0) return [];
  let weights = areas.map((area) => area.pixels.length);
  let weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum === 0) {
    weights = areas.map(() => 1);
    weightSum = areas.length;
  }
  const exact = weights.map((w) => total * w / weightSum);
  const counts = exact.map(Math.floor);
  let remaining = total - counts.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let i = 0; remaining > 0; i = (i + 1) % byRemainder.length, remaining--) {
    counts[byRemainder[i].index]++;
  }
  return counts;
}

/** A free cell around the centre of the area; count is how many creatures go there, and widens the search when they do not fit */
export function positionInArea(grid: Grid, area: WorldObject, count: number): GridPosition {
  const [x, y] = grid.clamp((area.x + area.width/2) * grid.size, (area.y + area.height/2) * grid.size);
  return grid.getCenteredAvailablePosition(x, y, area.width/2 * grid.size, area.height/2 * grid.size, count);
}

/**
 * The spawn zone of a creature's lineage: its spawnZone if it is still a zone of the map. Otherwise
 * (a loaded file, or the zones changed) the zone that covers its cell, or the one with the nearest centre.
 */
export function zoneOfCreature(creature: Creature, areas: WorldObject[], grid: Grid): number {
  if (creature.spawnZone !== null && creature.spawnZone < areas.length) return creature.spawnZone;
  const [cx, cy] = creature.position;
  const covering = areas.findIndex((area) => grid.cell(cx, cy).objects.includes(area));
  if (covering >= 0) return covering;
  let best = 0;
  let bestDistance = Infinity;
  areas.forEach((area, index) => {
    const dx = (area.x + area.width/2) * grid.size - cx;
    const dy = (area.y + area.height/2) * grid.size - cy;
    const distance = dx*dx + dy*dy;
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}
