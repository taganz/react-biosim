import Creature from "@/simulation/creature/Creature";
import Genome from "@/simulation/creature/brain/Genome";
import { computeSpeciesId } from "./speciesId";

/** A species (a lineage, see speciesId.ts) and some of its creatures */
export class Species {
  /** speciesId of its creatures */
  id: string;
  /** the species it came from, null for a root */
  parentId: string | null;
  /** generation in which it appeared, when known */
  firstGen?: number;

  constructor(public genome: Genome, public creatures: Creature[] = [], id?: string, parentId: string | null = null, firstGen?: number) {
    this.id = id ?? computeSpeciesId(genome.genes, null);
    this.parentId = id === undefined ? null : parentId;
    this.firstGen = firstGen;
  }

  /** the species of a creature, with it as its only known creature */
  static of(creature: Creature): Species {
    return new Species(creature.brain.genome.clone(), [creature], creature.speciesId, creature.speciesParentId);
  }

  // same colour as the creatures on the world, so it follows the phenotype mode
  getColor(): string {
    return this.creatures[0]?.getColor() ?? this.genome.getColor();
  }
}
