import Creature from "../creature/Creature";
import WorldGenerations from "./WorldGenerations";

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
