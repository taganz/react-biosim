import Genome from "./brain/Genome";
import { SimulationData } from "../SimulationData";

export type SpeciesSummary = {
  genome: Genome;
  creatures: number;
  /** share of all the creatures in the file, 0-100 */
  percentage: number;
};

export type LoadedSpeciesSummary = {
  /** creatures in the file, of every species */
  totalCreatures: number;
  /** different genomes in the file */
  totalSpecies: number;
  /** the most numerous species first, only those with at least minPercentage */
  top: SpeciesSummary[];
  /** the species left out of top, and their creatures */
  rest: { species: number; creatures: number; percentage: number };
};

// The species with most creatures in a loaded file. A file saved during a generation has species,
// one saved at its start has one genome per creature, and a setup has neither (no creatures)
export function summarizeLoadedSpecies(simulationData: SimulationData, limit = 10, minPercentage = 1): LoadedSpeciesSummary {
  const counts = new Map<string, { genome: Genome; creatures: number }>();
  const add = (genome: Genome, creatures: number) => {
    const key = genome.toDecimalString(false);
    const entry = counts.get(key);
    if (entry) entry.creatures += creatures;
    else counts.set(key, { genome, creatures });
  };

  if (simulationData.startGenomes) {
    simulationData.startGenomes.forEach((genome) => add(genome, 1));
  } else {
    simulationData.species?.forEach((species) => add(species.genome, species.creatures.length));
  }

  const all = Array.from(counts.values()).filter((entry) => entry.creatures > 0);
  const totalCreatures = all.reduce((sum, entry) => sum + entry.creatures, 0);
  const top = all
    .sort((a, b) => b.creatures - a.creatures)
    .slice(0, limit)
    .map((entry) => ({ ...entry, percentage: (entry.creatures / totalCreatures) * 100 }))
    .filter((entry) => entry.percentage >= minPercentage);

  const restCreatures = totalCreatures - top.reduce((sum, entry) => sum + entry.creatures, 0);
  const rest = {
    species: all.length - top.length,
    creatures: restCreatures,
    percentage: totalCreatures > 0 ? (restCreatures / totalCreatures) * 100 : 0,
  };

  return { totalCreatures, totalSpecies: all.length, top, rest };
}
