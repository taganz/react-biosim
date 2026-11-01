import Creature, { DeathCause } from "../creature/Creature";
import WorldGenerations from "./WorldGenerations";

export type SpeciesStats = {
  alive: number;
  /** creatures of the species when the generation was grouped */
  started: number;
  /** living creatures that were not there when the generation was grouped */
  bornSince: number;
  /** the started and born since that have died */
  died: number;
  /** averages of the living, null when none is alive */
  living: { age: number; mass: number; health: number; distance: number } | null;
  /** averages of every known creature, dead or alive; null when there are none */
  perCreature: { children: number; kills: number; attacks: number; photosynthesis: number; fromPrey: number } | null;
  /** average age of the dead when they died, null when none has died */
  averageAgeAtDeath: number | null;
  /** share of the deaths, 0-100, the most frequent first */
  deathCauses: { cause: DeathCause; percentage: number }[];
};

export type HerbivoreSpeciesRef = {
  /** colour code of the genome, as shown for the selected species */
  code: string;
  color: string;
  genomeSize: number;
};

export type HerbivoreOldAgeDeaths = Map<string, { species: HerbivoreSpeciesRef; deaths: number }>;

export type HerbivoreGenomeStats = {
  generation: number;
  /** herbivores alive when the generation ended */
  alive: number;
  /** the largest genome among them; when several species have it, the one with most creatures */
  largest: { species: HerbivoreSpeciesRef; creatures: number } | null;
  averageGenomeSize: number | null;
  /** of the herbivores that died of old age during the generation; the first to reach it wins a tie */
  mostOldAgeDeaths: { species: HerbivoreSpeciesRef; deaths: number } | null;
};

function herbivoreSpeciesRef(creature: Creature): HerbivoreSpeciesRef {
  return {
    code: creature.brain.genome.getHexColor(),
    color: creature.getColor(),
    genomeSize: creature.brain.genome.genes.length,
  };
}

// counts a herbivore that died of old age for the stats of the generation
export function addHerbivoreOldAgeDeath(deaths: HerbivoreOldAgeDeaths, creature: Creature): void {
  const key = creature.brain.genome.toDecimalString(false);
  const entry = deaths.get(key);
  if (entry) entry.deaths++;
  else deaths.set(key, { species: herbivoreSpeciesRef(creature), deaths: 1 });
}

// Genome sizes of the living herbivores and the species with most deaths of old age
export function computeHerbivoreGenomeStats(generation: number, creatures: readonly Creature[], oldAgeDeaths: HerbivoreOldAgeDeaths): HerbivoreGenomeStats {
  const herbivores = creatures.filter((creature) => creature.isAlive && creature.genus === "attack_plant");

  let maxSize = 0;
  let totalSize = 0;
  for (const creature of herbivores) {
    const size = creature.brain.genome.genes.length;
    totalSize += size;
    if (size > maxSize) maxSize = size;
  }

  // only the genomes of the largest size are converted to a key
  const largestCounts = new Map<string, { creature: Creature; creatures: number }>();
  for (const creature of herbivores) {
    if (creature.brain.genome.genes.length !== maxSize) continue;
    const key = creature.brain.genome.toDecimalString(false);
    const entry = largestCounts.get(key);
    if (entry) entry.creatures++;
    else largestCounts.set(key, { creature, creatures: 1 });
  }
  let largest: HerbivoreGenomeStats["largest"] = null;
  for (const { creature, creatures } of largestCounts.values()) {
    if (!largest || creatures > largest.creatures) {
      largest = { species: herbivoreSpeciesRef(creature), creatures };
    }
  }

  let mostOldAgeDeaths: HerbivoreGenomeStats["mostOldAgeDeaths"] = null;
  for (const entry of oldAgeDeaths.values()) {
    if (!mostOldAgeDeaths || entry.deaths > mostOldAgeDeaths.deaths) mostOldAgeDeaths = entry;
  }

  return {
    generation,
    alive: herbivores.length,
    largest,
    averageGenomeSize: herbivores.length > 0 ? totalSize / herbivores.length : null,
    mostOldAgeDeaths,
  };
}

// true when both creatures have the same genes, so they belong to the same species
export function haveSameGenome(a: Creature, b: Creature): boolean {
  const genesA = a.brain.genome.genes;
  const genesB = b.brain.genome.genes;
  return genesA.length === genesB.length && genesA.every((gene, index) => gene === genesB[index]);
}

// how many creatures are alive, and how many of them have exactly these genes (one species)
export function countLivingWithGenes(generations: WorldGenerations, genes: readonly number[]): { members: number; alive: number } {
  let members = 0;
  let alive = 0;
  for (const creature of generations.currentCreatures) {
    if (!creature.isAlive) continue;
    alive++;
    const other = creature.brain.genome.genes;
    if (other.length === genes.length && other.every((gene, index) => gene === genes[index])) members++;
  }
  return { members, alive };
}

// Averages of one species, so species of different sizes can be compared. startCreatures are its
// creatures when the generation was grouped: the living are read from the world, but a member born
// later that has already died is not known to anything, so it is not counted
export function computeSpeciesStats(generations: WorldGenerations, genes: readonly number[], startCreatures: readonly Creature[]): SpeciesStats {
  const living = generations.currentCreatures.filter((creature) => {
    const other = creature.brain.genome.genes;
    return creature.isAlive && other.length === genes.length && other.every((gene, index) => gene === genes[index]);
  });
  const known = new Set<Creature>([...startCreatures, ...living]);
  const dead = Array.from(known).filter((creature) => !creature.isAlive);

  const average = (creatures: Iterable<Creature>, count: number, value: (creature: Creature) => number) => {
    let sum = 0;
    for (const creature of creatures) sum += value(creature);
    return sum / count;
  };

  const causeCounts = new Map<DeathCause, number>();
  for (const creature of dead) {
    const cause = creature.deathCause ?? "unknown";
    causeCounts.set(cause, (causeCounts.get(cause) ?? 0) + 1);
  }

  return {
    alive: living.length,
    started: startCreatures.length,
    bornSince: known.size - startCreatures.length,
    died: dead.length,
    living: living.length > 0 ? {
      age: average(living, living.length, (creature) => creature._age),
      mass: average(living, living.length, (creature) => creature.mass),
      health: average(living, living.length, (creature) => creature.health),
      distance: average(living, living.length, (creature) => creature.distanceCovered),
    } : null,
    perCreature: known.size > 0 ? {
      children: average(known, known.size, (creature) => creature.childrenCount),
      kills: average(known, known.size, (creature) => creature.killCount),
      attacks: average(known, known.size, (creature) => creature.attackCount),
      photosynthesis: average(known, known.size, (creature) => creature.waterFromPhotosynthesis),
      fromPrey: average(known, known.size, (creature) => creature.waterFromPrey),
    } : null,
    // the age stops changing when a creature dies
    averageAgeAtDeath: dead.length > 0 ? average(dead, dead.length, (creature) => creature._age) : null,
    deathCauses: Array.from(causeCounts, ([cause, count]) => ({ cause, percentage: (count / dead.length) * 100 }))
      .sort((a, b) => b.percentage - a.percentage),
  };
}

// the living creatures of the same species as `creature` (itself included if alive), ordered by id
export function speciesMembers(generations: WorldGenerations, creature: Creature): Creature[] {
  return generations.currentCreatures
    .filter((other) => other.isAlive && haveSameGenome(other, creature))
    .sort((a, b) => a.id - b.id);
}

// the parent of `creature` if it is still alive. Ids can restart every generation,
// so the parent's birth generation must match too
export function findLivingParent(generations: WorldGenerations, creature: Creature): Creature | undefined {
  if (creature.parentId === null) return undefined;
  return generations.currentCreatures.find(
    (other) =>
      other.isAlive && other.id === creature.parentId && other.birthGen === creature.parentBirthGen
  );
}

// the living creature with this id. Ids can restart every generation, so when creatures of
// several generations share it (continuous runs) the youngest one is returned
export function findLivingCreatureById(generations: WorldGenerations, id: number): Creature | undefined {
  let found: Creature | undefined;
  for (const creature of generations.currentCreatures) {
    if (creature.isAlive && creature.id === id && (!found || creature.birthGen > found.birthGen)) {
      found = creature;
    }
  }
  return found;
}
