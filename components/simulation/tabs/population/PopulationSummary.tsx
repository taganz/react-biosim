"use client";

import useWorldValue from "@/hooks/useWorldValue";
import { Genus } from "@/simulation/creature/CreatureGenus";
import { GENUS_LABELS } from "./genusLabels";

interface Props {
  speciesCount: number;
}

const COUNTED_GENERA: Genus[] = ["plant", "attack_plant", "attack_animal"];

// One line with the state of the whole population. Everything but the species count is live;
// the species are grouped at the start of each generation.
export default function PopulationSummary({ speciesCount }: Props) {
  const currentGen = useWorldValue((world) => world.currentGen, 0);
  const currentStep = useWorldValue((world) => world.currentStep, 0);
  const alive = useWorldValue((world) => world.generations.currentCreatures.length, 0);
  // a string, so the snapshot is a primitive and React only re-renders when a count changes
  const genusCounts = useWorldValue((world) => {
    const counts = COUNTED_GENERA.map(() => 0);
    for (const creature of world.generations.currentCreatures) {
      const index = COUNTED_GENERA.indexOf(creature.genus);
      if (index >= 0) counts[index]++;
    }
    return counts.join(",");
  }, "");

  const genera = genusCounts
    .split(",")
    .map((count, index) => ({ genus: COUNTED_GENERA[index], count: Number(count) }))
    .filter(({ count }) => count > 0);

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 tabular-nums lg:text-lg">
      <span>
        <strong>Generation</strong> {currentGen} · <strong>step</strong> {currentStep}
      </span>
      <span>
        <strong>Alive creatures:</strong> {alive}
      </span>
      <span title="Counted at the start of the generation">
        <strong>Species:</strong> {speciesCount}
      </span>
      {genera.length > 0 && (
        <span>
          {genera.map(({ genus, count }) => `${GENUS_LABELS[genus]}s ${count}`).join(" · ")}
        </span>
      )}
    </div>
  );
}
