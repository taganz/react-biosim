import Creature from "../creature/Creature";
import WorldGenerations from "./WorldGenerations";

// true when both creatures have the same genes, so they belong to the same species
export function haveSameGenome(a: Creature, b: Creature): boolean {
  const genesA = a.brain.genome.genes;
  const genesB = b.brain.genome.genes;
  return genesA.length === genesB.length && genesA.every((gene, index) => gene === genesB[index]);
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
