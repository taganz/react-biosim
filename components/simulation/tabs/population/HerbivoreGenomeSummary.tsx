"use client";

import useWorldValue from "@/hooks/useWorldValue";
import { HerbivoreSpeciesRef } from "@/simulation/generations/creatureQueries";

function SpeciesCode({ species }: { species: HerbivoreSpeciesRef }) {
  return (
    <span className="text-shadow-sm px-1 font-bold" style={{ backgroundColor: species.color }}>
      {species.code}
    </span>
  );
}

// Genome sizes of the herbivores. Unlike the summary line, it only changes when a generation ends.
export default function HerbivoreGenomeSummary() {
  const stats = useWorldValue((world) => world.generations.lastHerbivoreGenomeStats, null);
  if (!stats || (stats.alive === 0 && !stats.mostOldAgeDeaths)) return null;

  const { generation, largest, averageGenomeSize, mostOldAgeDeaths } = stats;

  return (
    <div className="flex flex-col gap-1 tabular-nums">
      <strong>Herbivores at the end of generation {generation}</strong>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <span title="Among the herbivores alive when the generation ended. When several species have this size, the one with most creatures is shown">
          Largest genome:{" "}
          {largest ? <>{largest.species.genomeSize} genes, <SpeciesCode species={largest.species} /></> : "none alive"}
        </span>
        <span title="Among the herbivores alive when the generation ended">
          Average genome: {averageGenomeSize !== null ? `${averageGenomeSize.toFixed(1)} genes` : "none alive"}
        </span>
        <span title="Counted during the generation">
          Most deaths of old age:{" "}
          {mostOldAgeDeaths ? (
            <>
              <SpeciesCode species={mostOldAgeDeaths.species} /> {mostOldAgeDeaths.deaths} deaths, {mostOldAgeDeaths.species.genomeSize} genes
            </>
          ) : "none"}
        </span>
      </div>
    </div>
  );
}
