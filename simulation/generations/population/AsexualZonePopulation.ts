import { shuffle } from "@/simulation/helpers/random";
import WorldGenerations from "../WorldGenerations";
import {GridPosition} from "../../world/grid/Grid";
import Creature from "../../creature/Creature";
import PopulationStrategy from "./PopulationStrategy";
import { countsByArea, positionInArea, spawnAreas, zoneOfCreature } from "./spawnZones";

/**
 * With spawn areas, generation 1 is split among them in proportion to their size, and each child is
 * placed in the spawn area of its parent's lineage. Without spawn areas it works like AsexualRandomPopulation.
 */
export default class AsexualZonePopulation implements PopulationStrategy {
  name = "AsexualZonePopulation";
  populate(generations: WorldGenerations, parents?: Creature[]): void {
    const grid = generations.grid;
    const areas = spawnAreas(grid);

    // First generation
    if (generations.isFirstGeneration) {
      if (areas.length === 0) {
        for (let i = 0; i < generations.initialPopulation; i++) {
          const position = grid.getRandomAvailablePosition();
          if (position != null) {
            generations.newCreature(position, true);
          }
          else {
            console.warn("no position for creature");
          }
        }
        return;
      }
      const counts = countsByArea(areas, generations.initialPopulation);
      for (let zone = 0; zone < areas.length; zone++) {
        for (let i = 0; i < counts[zone]; i++) {
          const creature = generations.newCreature(positionInArea(grid, areas[zone], counts[zone]), true);
          creature.spawnZone = zone;
        }
      }

    } else if (parents) {
      const childParents = AsexualZonePopulation.parentOfEachChild(generations.initialPopulation, parents);

      if (areas.length === 0) {
        for (const parent of childParents) {
          const position : GridPosition | null = grid.getRandomAvailablePosition();
          if (position != null) {
            generations.newCreature(position, false, parent.brain.genome, parent);
          }
          else {
            console.warn("no free position found 2");
          }
        }
        return;
      }

      const zones = childParents.map((parent) => zoneOfCreature(parent, areas, grid));
      const childrenInZone = areas.map((_, zone) => zones.filter((z) => z === zone).length);
      childParents.forEach((parent, i) => {
        const zone = zones[i];
        const child = generations.newCreature(positionInArea(grid, areas[zone], childrenInZone[zone]), false, parent.brain.genome, parent);
        child.spawnZone = zone;
      });
    }
  }

  /**
   * The parent of each child of the next generation, in birth order. Every survivor has at least one
   * child; with more survivors than initialPopulation, only the first initialPopulation of the shuffle have one.
   */
  static parentOfEachChild(initialPopulation: number, parents: Creature[]): Creature[] {
    const shuffledParents = shuffle(parents);
    if (parents.length > initialPopulation) {
      return shuffledParents.slice(0, initialPopulation);
    }
    const childrenPerParent = Math.max(Math.ceil(initialPopulation / parents.length), 1);
    let totalNeededCreatures = initialPopulation - parents.length;
    const result: Creature[] = [];
    for (const parent of shuffledParents) {
      for (let childIdx = 0; childIdx < childrenPerParent; childIdx++) {
        if (childIdx === 0 || totalNeededCreatures > 0) {
          if (childIdx > 0) {
            totalNeededCreatures--;
          }
          result.push(parent);
        }
      }
    }
    return result;
  }
}
