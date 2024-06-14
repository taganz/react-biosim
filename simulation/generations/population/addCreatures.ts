import WorldGenerations from "../WorldGenerations";
import { Genus } from "@/simulation/creature/CreatureGenus";
import Genome from "@/simulation/creature/brain/Genome";
import { GridPosition } from "@/simulation/world/grid/Grid";
import CreatureGenus from "@/simulation/creature/CreatureGenus";
import Creature from "@/simulation/creature/Creature";

// creates a number of creatures for a given genus

export function addCreaturesFromGenus(worldGenerations: WorldGenerations, genus: Genus, total: number) {
    for (let i = 0; i < total; i++) {
      let position : GridPosition | null = worldGenerations.grid.getRandomAvailablePosition();
      if (position != null) {
          var genes = CreatureGenus.geneArrayForGenus(worldGenerations, genus, worldGenerations.initialGenomeSize);
          worldGenerations.newCreature(position, true, new Genome(genes) );
      }
      else {
        console.warn("no free position found");
      }
    }
  }

// creates a number of creatures for a given parent

  export function addCreaturesFromParent(worldGenerations: WorldGenerations, parent: Creature, total: number) {
    for (let i = 0; i < total; i++) {
      let position : GridPosition | null = worldGenerations.grid.getRandomAvailablePosition();
      if (position != null) {
          worldGenerations.newCreature(position, false, parent.brain.genome );
      }
      else {
        console.warn("no free position found");
      }
    }
  }