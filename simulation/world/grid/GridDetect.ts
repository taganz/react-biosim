import { GridPosition } from "./Grid";
import { Grid } from "./Grid";
import { Genus } from "@/simulation/creature/CreatureGenus";
import type Creature from "@/simulation/creature/Creature";


export interface DetectedCreature {
    position: GridPosition;
    distance: number;
    genus: Genus;
}

// an aproximate distance function that counts "chess king steps"
export function gridDistance(a: GridPosition, b:GridPosition): number {
    if (a[0]==b[0] && a[1]==b[1]) return 0;
    const dx = Math.abs(b[0] - a[0]);
    const dy = Math.abs(b[1] - a[1]);
    return Math.max(dx, dy);
}


/*
function gridDistance(a: GridPosition, b: GridPosition): number {
    // Calculating Euclidean distance for positions a and b
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}
*/

//TODO --> future take in account obstacles blocking detection


// returns creatures inside radius distance 
export function detectAll(grid: Grid, origin: GridPosition, radius: number): DetectedCreature[] {
    const absRadius = Math.abs(radius);
    const detected: DetectedCreature[] = [];
    const x0 = origin[0];
    const y0 = origin[1];
    // Boundaries to check
    const topLeft = grid.clamp(x0 - absRadius, y0 - absRadius);
    const bottomRight = grid.clamp(x0 + absRadius + 1, y0 + absRadius + 1);

    for (let i = topLeft[0]; i < bottomRight[0]; i++) {
        for (let j = topLeft[1]; j < bottomRight[1]; j++) {
            if (!(i == x0 && j == y0)) {  // Checking if not the origin
                const creature = grid.cell(i, j).creature;
                if (creature != null) {
                    const position: GridPosition = [i, j];
                    const distance = gridDistance(origin, position);
                    if (distance <= absRadius) {
                        detected.push({
                            position: position,
                            distance: distance,
                            genus: creature._genus
                        });
                    }
                }
            }
        }
    }
    return detected;
}

// returns the closest creature inside radius distance, of the given genus if there is one.
// The prey sensors call it for every creature at every step, so instead of collecting every
// creature around (detectAll) it searches ring by ring and stops at the first ring with a match.
// It returns the same creature as detectAll + the closest: the same bounds, and among creatures
// at the same distance the last one in detectAll's order (by x, then by y)
export function detectClosest(grid: Grid, origin: GridPosition, radius: number, genus?: Genus): DetectedCreature | null {
    const absRadius = Math.abs(radius);
    const x0 = origin[0];
    const y0 = origin[1];
    // same bounds as detectAll (the end is exclusive)
    const [minX, minY] = grid.clamp(x0 - absRadius, y0 - absRadius);
    const [endX, endY] = grid.clamp(x0 + absRadius + 1, y0 + absRadius + 1);

    for (let distance = 1; distance <= absRadius; distance++) {
        const fromX = Math.max(x0 - distance, minX);
        const toX = Math.min(x0 + distance, endX - 1);
        const fromY = Math.max(y0 - distance, minY);
        const toY = Math.min(y0 + distance, endY - 1);
        // typed with "as": TypeScript does not see the assignments inside check()
        let found = null as Creature | null;
        let foundX = 0;
        let foundY = 0;
        // keeps the last match, like the order of detectAll
        const check = (i: number, j: number) => {
            const creature = grid.cell(i, j).creature;
            if (creature != null && (genus === undefined || creature._genus === genus)) {
                found = creature;
                foundX = i;
                foundY = j;
            }
        };

        for (let i = fromX; i <= toX; i++) {
            if (i === x0 - distance || i === x0 + distance) {
                // a side of the ring: the whole column
                for (let j = fromY; j <= toY; j++) check(i, j);
            } else {
                // inside the ring: only its top and bottom cells
                if (y0 - distance >= fromY) check(i, y0 - distance);
                if (y0 + distance <= toY) check(i, y0 + distance);
            }
        }
        if (found) {
            return { position: [foundX, foundY], distance: distance, genus: found._genus };
        }
    }
    return null;
}
