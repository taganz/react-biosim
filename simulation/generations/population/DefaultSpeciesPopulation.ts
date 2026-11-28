import WorldGenerations from "../WorldGenerations";
import Genome from "../../creature/brain/Genome";
import AsexualZonePopulation from "./AsexualZonePopulation";

/**
 * Like AsexualZonePopulation, but generation 1 is made of the genomes in
 * constants.POPULATION_DEFAULT_SPECIES, in equal shares: the i-th creature gets species i mod n.
 * They are copied without mutation. With an empty list, generation 1 has random genomes.
 */
export default class DefaultSpeciesPopulation extends AsexualZonePopulation {
  name = "DefaultSpeciesPopulation";

  protected firstGenerationGenome(generations: WorldGenerations, index: number): Genome | undefined {
    const species = generations.worldController.simData.constants.POPULATION_DEFAULT_SPECIES ?? [];
    if (species.length === 0) {
      if (index === 0) console.warn("DefaultSpeciesPopulation: POPULATION_DEFAULT_SPECIES is empty, generation 1 has random genomes");
      return undefined;
    }
    return new Genome(species[index % species.length].genome.slice());
  }
}
