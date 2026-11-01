"use client";

import { useRef } from "react";
import useWorldValue from "@/hooks/useWorldValue";
import Creature, { DeathCause } from "@/simulation/creature/Creature";
import { Species } from "@/simulation/creature/Species";
import { computeSpeciesStats, SpeciesStats as Stats } from "@/simulation/generations/creatureQueries";
import { Field, Group } from "./SelectedCreatureInfo";

interface Props {
  species: Species;
  /** its creatures when the generation was grouped; the selected species may only hold the clicked one */
  startCreatures: Creature[];
}

const DEATH_CAUSES: Record<DeathCause, string> = {
  old: "Old age",
  basalConsumption: "Ran out of mass",
  attacked: "Eaten",
  health: "Health reached 0",
  unknown: "Unknown cause",
};

const UNCOUNTED_DEATHS = "Creatures born after the species were grouped that have already died are not counted.";

// Averages of a species, so it can be compared with species of other sizes
export default function SpeciesStats({ species, startCreatures }: Props) {
  // a string, so the snapshot is a primitive. As with the counts of the selected species, with
  // Immediate steps above 1 it is only redone when the canvas is redrawn
  const cache = useRef<{ species: Species; startCreatures: Creature[]; redrawCount: number; value: string }>(undefined);
  const value = useWorldValue((world) => {
    const cached = cache.current;
    const throttled = world.immediateSteps > 1 && !world.isPaused;
    if (
      throttled &&
      cached?.species === species &&
      cached.startCreatures === startCreatures &&
      cached.redrawCount === world.redrawCount
    ) {
      return cached.value;
    }
    const stats = computeSpeciesStats(world.generations, species.genome.genes, startCreatures);
    const json = JSON.stringify(stats);
    cache.current = { species, startCreatures, redrawCount: world.redrawCount, value: json };
    return json;
  }, "");
  if (value === "") return null;

  const { alive, started, bornSince, died, living, perCreature, deathCauses } = JSON.parse(value) as Stats;

  return (
    <div className="flex flex-col gap-3">
      <Group title="Population">
        <Field label="Alive">{alive} of {started + bornSince} known</Field>
        <Field label="Started generation">{started}</Field>
        <Field label="Born since">{bornSince}</Field>
        <Field label="Died">{died}</Field>
      </Group>

      {living && (
        <Group title="Average of the living">
          <Field label="Age">{living.age.toFixed(1)}</Field>
          <Field label="Mass">{living.mass.toFixed(2)}</Field>
          <Field label="Health">{living.health.toFixed(1)}</Field>
          <Field label="Distance index">{living.distance.toFixed(1)}</Field>
        </Group>
      )}

      {perCreature && (
        <div title={UNCOUNTED_DEATHS}>
          <Group title="Average per creature, dead or alive">
            <Field label="Children">{perCreature.children.toFixed(2)}</Field>
            <Field label="Kills">{perCreature.kills.toFixed(2)}</Field>
            <Field label="Attacks">{perCreature.attacks.toFixed(2)}</Field>
            <Field label="Photosynthesis">{perCreature.photosynthesis.toFixed(2)}</Field>
            <Field label="From prey">{perCreature.fromPrey.toFixed(2)}</Field>
          </Group>
        </div>
      )}

      {deathCauses.length > 0 && (
        <div title={UNCOUNTED_DEATHS}>
          <Group title="Causes of death">
            {deathCauses.map(({ cause, percentage }) => (
              <Field key={cause} label={DEATH_CAUSES[cause]}>{percentage.toFixed(0)}%</Field>
            ))}
          </Group>
        </div>
      )}
    </div>
  );
}
