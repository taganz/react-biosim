/**
 * Species of the log and the Population tab: a lineage, the genome together with the species it
 * came from. The same genome reached by mutation from two parent species is two species.
 *
 * A child with the genome of its parent keeps the parent's species; any other genome gets the id
 * computed here from its genes and the parent's species (null for creatures without a parent).
 * The id is a 64-bit hash written as 16 hexadecimal digits. It draws no random numbers.
 */
export function computeSpeciesId(genes: readonly number[], parentSpeciesId: string | null): string {
  // two 32-bit lanes with different seeds (cyrb53 style), mixed at the end
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  const add = (value: number) => {
    h1 = Math.imul(h1 ^ value, 2654435761);
    h2 = Math.imul(h2 ^ value, 1597334677);
  };
  add(genes.length);
  for (const gene of genes) add(gene | 0);
  const parent = parentSpeciesId ?? "root";
  for (let i = 0; i < parent.length; i++) add(parent.charCodeAt(i));
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

export function sameGenes(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export interface SpeciesLineage {
  speciesId: string;
  /** the species this species came from; null for a species without a known parent (a root) */
  speciesParentId: string | null;
}

/** the species of a new creature with these genes and this parent (see computeSpeciesId) */
export function speciesOfChild(
  genes: readonly number[],
  parent: (SpeciesLineage & { brain: { genome: { genes: readonly number[] } } }) | undefined
): SpeciesLineage {
  if (!parent) return { speciesId: computeSpeciesId(genes, null), speciesParentId: null };
  if (sameGenes(genes, parent.brain.genome.genes)) {
    return { speciesId: parent.speciesId, speciesParentId: parent.speciesParentId };
  }
  return { speciesId: computeSpeciesId(genes, parent.speciesId), speciesParentId: parent.speciesId };
}
