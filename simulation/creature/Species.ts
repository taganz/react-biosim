import Creature from "@/simulation/creature/Creature";
import Genome from "@/simulation/creature/brain/Genome";

export class Species {
  genomeKey: string;

  constructor(public genome: Genome, public creatures: Creature[] = []) {
    this.genomeKey = genome.toDecimalString(false);
  }

  // same colour as the creatures on the world, so it follows the phenotype mode
  getColor(): string {
    return this.creatures[0]?.getColor() ?? this.genome.getColor();
  }
}
