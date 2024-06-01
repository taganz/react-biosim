import { Genus } from "@/simulation/creature/CreatureGenus";


export type GenusProbability = {
    genus: Genus;
    probability: number;
  };

export function selectGenusBasedOnProbability(genera: GenusProbability[]) : Genus {
    const random = Math.random();
  
    let cumulativeProbability = 0;
    for (const genus of genera) {
      cumulativeProbability += genus.probability;
      // Check if the random number is less than the cumulative probability
      if (random < cumulativeProbability) {
        return genus.genus;
      }
    }
    // Fallback in case of any rounding error in probabilities
    return genera[genera.length - 1].genus;
  }