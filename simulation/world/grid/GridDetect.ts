import { GridPosition } from "./Grid";
import { Grid } from "./Grid";
import { Genus } from "@/simulation/creature/CreatureGenus";


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

// returns closes creature inside radius distance
export function detectClosest(grid: Grid, origin: GridPosition, radius: number, genus?: Genus): DetectedCreature | null {
    let creatures = [];
    if (genus) {
        creatures = detectAll(grid, origin, radius).filter(creat => creat.genus === genus);
    }
    else {
        creatures = detectAll(grid, origin, radius);
    }
    if (creatures.length === 0) {
        return null; // No creatures found within the given radius
    }
    // Find the creature with the minimum distance
    if (typeof genus === 'undefined') {
        return creatures.reduce((closest, creature) => {
            return (closest.distance < creature.distance) ? closest : creature;
        });
    } else {
        // Find the creature with the minimum distance
        const selected = creatures.reduce((closest, creature) => {
            // console.log("reduce creature", creature);
            return ((closest.distance < creature.distance ) ? closest : creature);
        });
        if (selected.genus == genus) {
            return selected;
        } else {
            return null;
        }
    }
}

