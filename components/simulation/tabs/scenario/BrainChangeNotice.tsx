"use client";

import { useMemo } from "react";
import useWorldValue from "@/hooks/useWorldValue";
import WorldGenerationsData from "@/simulation/generations/WorldGenerationsData";
import { countChangedBrains, decodingFromData, sameDecoding } from "@/simulation/creature/brain/geneTranslation";

type Props = { draft: WorldGenerationsData };

// What "Update simulation" does to the brains of the living creatures when the draft changes
// the enabled sensors, the enabled actions or Max neurons (see geneTranslation.ts)
export default function BrainChangeNotice({ draft }: Props) {
  const { enabledSensors, enabledActions, maxNumberNeurons } = draft;
  const draftDecoding = useMemo(
    () => decodingFromData({ enabledSensors, enabledActions, maxNumberNeurons }),
    [enabledSensors, enabledActions, maxNumberNeurons]
  );

  // -1: the genes decode the same way, nothing to say
  const changed = useWorldValue((world) => {
    const running = world.generations.geneDecoding;
    if (sameDecoding(running, draftDecoding)) return -1;
    const genomes = (function* () {
      for (const creature of world.generations.currentCreatures) yield creature.brain.genome.genes;
    })();
    return countChangedBrains(genomes, running, draftDecoding);
  }, -1);

  if (changed < 0) return null;
  if (changed === 0) {
    return (
      <p className="text-xs">
        &quot;Update simulation&quot; keeps every brain: the genes are rewritten for the new sensors, actions and
        Max neurons.
      </p>
    );
  }
  return (
    <p className="bg-red p-2 text-xs">
      &quot;Update simulation&quot; changes the brain of {changed} {changed === 1 ? "creature" : "creatures"}: some of
      their genes use a sensor or action you disabled (they are deleted) or a neuron not below the new Max neurons
      (it connects to another neuron). The other brains are kept.
    </p>
  );
}
