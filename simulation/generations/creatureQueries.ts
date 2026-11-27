import Creature, { DeathCause } from "../creature/Creature";
import WorldGenerations from "./WorldGenerations";

/** where the mass of a creature came from and went since it was born (see CreatureMass) */
export type MassBalance = {
  start: number;
  photosynthesis: number;
  /** eaten from prey of the plant genus */
  fromPlants: number;
  /** eaten from prey of the other genera: other animals */
  fromAnimals: number;
  basal: number;
  thinking: number;
  moving: number;
  attacking: number;
  reproductionCost: number;
  givenToChildren: number;
  /** start plus the gains minus the costs: its mass, or the mass it had when it died */
  end: number;
};

export function creatureMassBalance(creature: Creature): MassBalance {
  const mass = creature._mass;
  const balance = {
    start: mass.startMass,
    photosynthesis: creature.waterFromPhotosynthesis,
    fromPlants: creature.waterFromPlants,
    fromAnimals: creature.waterFromAnimals,
    basal: mass.totalBasal,
    thinking: mass.totalThinking,
    moving: mass.totalMoving,
    attacking: mass.totalAttacking,
    reproductionCost: mass.totalReproductionCost,
    givenToChildren: mass.totalGivenToChildren,
  };
  return {
    ...balance,
    end: balance.start + balance.photosynthesis + balance.fromPlants + balance.fromAnimals - balance.basal - balance.thinking
      - balance.moving - balance.attacking - balance.reproductionCost - balance.givenToChildren,
  };
}

export type SpeciesStats = {
  alive: number;
  /** creatures of the species when the generation (or time window) started */
  started: number;
  /** creatures born since then */
  bornSince: number;
  /** creatures that died since then */
  died: number;
  /** averages of the living, null when none is alive */
  living: {
    age: number; mass: number; health: number; distance: number; stepsStopped: number;
    /** shares of the living, 0-100 */
    canMove: number; canReproduce: number;
  } | null;
  /** averages of every known creature, dead or alive; null when there are none */
  perCreature: {
    children: number; plantKills: number; animalKills: number; attacks: number; photosynthesis: number; fromPlants: number; fromAnimals: number;
    /** the average of each line of the mass balance */
    balance: MassBalance;
  } | null;
  /** average age of the dead when they died, null when none has died */
  averageAgeAtDeath: number | null;
  /** share of the deaths, 0-100, the most frequent first */
  deathCauses: { cause: DeathCause; percentage: number }[];
};

export type AnimalSpeciesRef = {
  /** colour code of the genome, as shown for the selected species */
  code: string;
  color: string;
  genomeSize: number;
};

export type AnimalOldAgeDeaths = Map<string, { species: AnimalSpeciesRef; deaths: number }>;

export type AnimalGenomeStats = {
  generation: number;
  /** animals alive when the generation ended */
  alive: number;
  /** the largest genome among them; when several species have it, the one with most creatures */
  largest: { species: AnimalSpeciesRef; creatures: number } | null;
  averageGenomeSize: number | null;
  /** of the animals that died of old age during the generation; the first to reach it wins a tie */
  mostOldAgeDeaths: { species: AnimalSpeciesRef; deaths: number } | null;
};

function animalSpeciesRef(creature: Creature): AnimalSpeciesRef {
  return {
    code: creature.brain.genome.getHexColor(),
    color: creature.getColor(),
    genomeSize: creature.brain.genome.genes.length,
  };
}

// counts an animal that died of old age for the stats of the generation
export function addAnimalOldAgeDeath(deaths: AnimalOldAgeDeaths, creature: Creature): void {
  const key = creature.brain.genome.toDecimalString(false);
  const entry = deaths.get(key);
  if (entry) entry.deaths++;
  else deaths.set(key, { species: animalSpeciesRef(creature), deaths: 1 });
}

// Genome sizes of the living animals and the species with most deaths of old age
export function computeAnimalGenomeStats(generation: number, creatures: readonly Creature[], oldAgeDeaths: AnimalOldAgeDeaths): AnimalGenomeStats {
  const animals = creatures.filter((creature) => creature.isAlive && creature.genus === "attack_plant");

  let maxSize = 0;
  let totalSize = 0;
  for (const creature of animals) {
    const size = creature.brain.genome.genes.length;
    totalSize += size;
    if (size > maxSize) maxSize = size;
  }

  // only the genomes of the largest size are converted to a key
  const largestCounts = new Map<string, { creature: Creature; creatures: number }>();
  for (const creature of animals) {
    if (creature.brain.genome.genes.length !== maxSize) continue;
    const key = creature.brain.genome.toDecimalString(false);
    const entry = largestCounts.get(key);
    if (entry) entry.creatures++;
    else largestCounts.set(key, { creature, creatures: 1 });
  }
  let largest: AnimalGenomeStats["largest"] = null;
  for (const { creature, creatures } of largestCounts.values()) {
    if (!largest || creatures > largest.creatures) {
      largest = { species: animalSpeciesRef(creature), creatures };
    }
  }

  let mostOldAgeDeaths: AnimalGenomeStats["mostOldAgeDeaths"] = null;
  for (const entry of oldAgeDeaths.values()) {
    if (!mostOldAgeDeaths || entry.deaths > mostOldAgeDeaths.deaths) mostOldAgeDeaths = entry;
  }

  return {
    generation,
    alive: animals.length,
    largest,
    averageGenomeSize: animals.length > 0 ? totalSize / animals.length : null,
    mostOldAgeDeaths,
  };
}

// how many creatures are alive, and how many of them belong to this species
export function countLivingOfSpecies(generations: WorldGenerations, speciesId: string): { members: number; alive: number } {
  let members = 0;
  let alive = 0;
  for (const creature of generations.currentCreatures) {
    if (!creature.isAlive) continue;
    alive++;
    if (creature.speciesId === speciesId) members++;
  }
  return { members, alive };
}

// Averages of one species, so species of different sizes can be compared: its living creatures,
// and the ones that died in the current generation (or time window)
export function computeSpeciesStats(generations: WorldGenerations, speciesId: string): SpeciesStats {
  const living = generations.currentCreatures.filter((creature) => creature.isAlive && creature.speciesId === speciesId);
  const dead = generations.speciesRegistry.deadThisGeneration.filter((creature) => creature.speciesId === speciesId);
  const record = generations.speciesRegistry.get(speciesId);
  return speciesStatsOf(living, dead, record?.started ?? 0, record?.born ?? 0);
}

/** the stats of a species from its living creatures and the ones that died in the generation */
export function speciesStatsOf(living: readonly Creature[], dead: readonly Creature[], started: number, born: number): SpeciesStats {
  const known = [...living, ...dead];

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
    started,
    bornSince: born,
    died: dead.length,
    living: living.length > 0 ? {
      age: average(living, living.length, (creature) => creature._age),
      mass: average(living, living.length, (creature) => creature.mass),
      health: average(living, living.length, (creature) => creature.health),
      distance: average(living, living.length, (creature) => creature.distanceCovered),
      stepsStopped: average(living, living.length, (creature) => creature.stepsStopped),
      canMove: average(living, living.length, (creature) => creature.hasEnoughMassToMove() ? 100 : 0),
      canReproduce: average(living, living.length, (creature) => creature.reproduction.hasEnoughtMassToReproduce ? 100 : 0),
    } : null,
    perCreature: known.length > 0 ? {
      children: average(known, known.length, (creature) => creature.childrenCount),
      plantKills: average(known, known.length, (creature) => creature.plantKillCount),
      animalKills: average(known, known.length, (creature) => creature.animalKillCount),
      attacks: average(known, known.length, (creature) => creature.attackCount),
      photosynthesis: average(known, known.length, (creature) => creature.waterFromPhotosynthesis),
      fromPlants: average(known, known.length, (creature) => creature.waterFromPlants),
      fromAnimals: average(known, known.length, (creature) => creature.waterFromAnimals),
      balance: averageBalance(known.map(creatureMassBalance)),
    } : null,
    // the age stops changing when a creature dies
    averageAgeAtDeath: dead.length > 0 ? average(dead, dead.length, (creature) => creature._age) : null,
    deathCauses: Array.from(causeCounts, ([cause, count]) => ({ cause, percentage: (count / dead.length) * 100 }))
      .sort((a, b) => b.percentage - a.percentage),
  };
}

// the average of each line; at least one balance
function averageBalance(balances: MassBalance[]): MassBalance {
  const result = { ...balances[0] };
  const keys = Object.keys(result) as (keyof MassBalance)[];
  for (const key of keys) {
    let sum = 0;
    for (const balance of balances) sum += balance[key];
    result[key] = sum / balances.length;
  }
  return result;
}

// the living creatures of the same species as `creature` (itself included if alive), ordered by id
export function speciesMembers(generations: WorldGenerations, creature: Creature): Creature[] {
  return generations.currentCreatures
    .filter((other) => other.isAlive && other.speciesId === creature.speciesId)
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
