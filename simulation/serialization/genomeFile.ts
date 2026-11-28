import { Gene } from "@/simulation/creature/brain/Genome";
import { computeSpeciesId, sameGenes } from "@/simulation/creature/speciesId";
import { SavedSimulationData } from "./data/SavedSimulationData";
import migrateSavedSimulationData, { SAVE_FORMAT_VERSION } from "./migrateSavedSimulationData";

/*
The genomes of a .sim file, for the brain editor (app/brain-editor): read them, change them and
write the file again. The file is first brought to the current format, so the genes are read with
its current enabled lists, and it is written in the current format.
*/

/**
 * Where a genome is in the file:
 * - species: a species of the world, with its creatures;
 * - startGenome: a genome of a generation start (My scenarios), with its count;
 * - defaultSpecies: an entry of POPULATION_DEFAULT_SPECIES, the generation 1 of Default Species;
 * - plantGenes: the plant genes of the Plants and Herbivores strategy.
 */
export type GenomeSource = "species" | "startGenome" | "defaultSpecies" | "plantGenes";

export type GenomeEntry = {
  /** unique in the file: source and position */
  key: string;
  source: GenomeSource;
  index: number;
  label: string;
  /** creatures that carry it (species, startGenome), 0 for the others */
  creatures: number;
  genes: Gene[];
  /** species id, for species */
  speciesId?: string;
};

export function parseSimFile(text: string): SavedSimulationData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("it is not a JSON file.");
  }
  return migrateSavedSimulationData(parsed);
}

export function listGenomes(data: SavedSimulationData): GenomeEntry[] {
  const entries: GenomeEntry[] = [];
  data.species?.forEach((species, index) => entries.push({
    key: `species:${index}`, source: "species", index,
    label: `Species ${index + 1}`, creatures: species.creatures.length,
    genes: species.genes.slice(), speciesId: species.id,
  }));
  data.startGenomes?.forEach((genome, index) => entries.push({
    key: `startGenome:${index}`, source: "startGenome", index,
    label: `Start genome ${index + 1}`, creatures: genome.count, genes: genome.genes.slice(),
  }));
  const defaultSpecies: { name: string; genome: Gene[] }[] = data.constants?.POPULATION_DEFAULT_SPECIES ?? [];
  defaultSpecies.forEach((species, index) => entries.push({
    key: `defaultSpecies:${index}`, source: "defaultSpecies", index,
    label: species.name || `Default species ${index + 1}`, creatures: 0, genes: species.genome.slice(),
  }));
  const plantGenes = data.worldGenerationsData.plantGenes;
  if (plantGenes && plantGenes.length > 0) {
    entries.push({ key: "plantGenes:0", source: "plantGenes", index: 0, label: "Plant genes", creatures: 0, genes: plantGenes.slice() });
  }
  return entries;
}

/**
 * A copy of the file with the edited genomes (by entry key). An edited species becomes a new
 * species that comes from the one it was: its id is computed from the new genes and the old id,
 * as for a mutation, and it appears in the generation of the file.
 */
export function applyGenomeEdits(data: SavedSimulationData, edits: ReadonlyMap<string, readonly Gene[]>): SavedSimulationData {
  const result: SavedSimulationData = structuredClone(data);
  result.version = SAVE_FORMAT_VERSION;
  const currentGen = data.worldControllerData.currentGen;

  for (const [key, genes] of edits) {
    if (genes.length === 0) throw new Error(`${key} has no genes: a genome needs at least one.`);
    const [source, indexText] = key.split(":");
    const index = Number(indexText);
    if (source === "species" && result.species?.[index]) {
      const species = result.species[index];
      if (sameGenes(species.genes, genes)) continue;
      const original = data.species![index];
      const parentId = original.id ?? computeSpeciesId(original.genes, null);
      species.genes = genes.slice();
      species.id = computeSpeciesId(genes, parentId);
      species.parentId = parentId;
      if (currentGen !== undefined) species.firstGen = currentGen;
    } else if (source === "startGenome" && result.startGenomes?.[index]) {
      result.startGenomes[index].genes = genes.slice();
    } else if (source === "defaultSpecies" && result.constants?.POPULATION_DEFAULT_SPECIES?.[index]) {
      result.constants.POPULATION_DEFAULT_SPECIES[index].genome = genes.slice();
    } else if (source === "plantGenes") {
      result.worldGenerationsData.plantGenes = genes.slice();
    } else {
      throw new Error(`the file has no genome ${key}.`);
    }
  }
  return result;
}

/** the file as text, indented when PRETTIFY_OUTPUT_TO_FILE is set, as the app saves it */
export function stringifySimFile(data: SavedSimulationData): string {
  return data.constants?.PRETTIFY_OUTPUT_TO_FILE ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

/** the name of the edited file: "<name> edited.sim" */
export function editedFileName(name: string): string {
  const base = name.replace(/\.(sim|json|txt)$/i, "");
  return `${base} edited.sim`;
}
