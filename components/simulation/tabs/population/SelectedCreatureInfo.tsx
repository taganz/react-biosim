"use client";

import { useMemo } from "react";
import Creature, { DeathCause, maxHealth } from "@/simulation/creature/Creature";
import useWorldValue from "@/hooks/useWorldValue";
import { getNetworkLabels } from "@/simulation/creature/brain/Helpers/networkLabels";
import { GENUS_LABELS } from "./genusLabels";
import { formatWeight } from "./NetworkDiagram";
import { creatureMassBalance } from "@/simulation/generations/creatureQueries";
import { CostFields, Field, formatMass, GeneFields, Group, MassBalanceFields, Meter, YesNo } from "./InfoFields";

interface Props {
  creature: Creature;
}


// each one starts the sentence that says when the creature died
const DEATH_CAUSES: Record<DeathCause, string> = {
  old: "Died of old age",
  basalConsumption: "Ran out of mass (basal consumption)",
  attacked: "Was eaten",
  health: "Its health reached 0",
  unknown: "Died",
};

function deathText(creature: Creature): string {
  if (creature.deathCause === null) {
    // generational runs replace the creatures without killing them
    return "Not in the world anymore: it was replaced by a new generation or run.";
  }
  const killer = creature.deathCause === "attacked" && creature.killedBySpecies
    ? ` by a creature of species ${creature.killedBySpecies}`
    : "";
  return `${DEATH_CAUSES[creature.deathCause]}${killer} at generation ${creature.deathGen}, step ${creature.deathStep}. The values are from its last step.`;
}

// Everything about one creature, read again on every step so the values stay live
export default function SelectedCreatureInfo({ creature }: Props) {
  // these subscriptions only make the component re-render as the simulation advances
  useWorldValue((world) => world.currentStep, 0);
  useWorldValue((world) => world.currentGen, 0);
  const isInWorld = useWorldValue(
    (world) => creature.isAlive && world.generations.currentCreatures.includes(creature),
    false
  );

  const actionLabels = useMemo(() => getNetworkLabels(creature).actions, [creature]);

  const { genus, preyGenus, generations } = creature;
  const massData = creature._mass;
  const metabolismEnabled = massData._metabolismEnabled;
  const network = creature.brain.brain;
  const [x, y] = creature.position;
  const cell = generations.grid.isTileInsideWorld(x, y) ? generations.grid.cell(x, y) : undefined;

  // the action with the highest output this step; movement actions need a positive output
  let strongestAction = -1;
  network.outputs.forEach((output, index) => {
    if (strongestAction < 0 || output > network.outputs[strongestAction]) strongestAction = index;
  });

  return (
    <div className="flex flex-col gap-3">
      {!isInWorld && (
        <p className="bg-red p-2 text-sm">{deathText(creature)}</p>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-4">
        <Group title="Identity">
          <Field label="Id">#{creature.id}</Field>
          <Field label="Species">
            <span className="text-shadow-sm px-1" style={{ backgroundColor: creature.getColor() }}>
              {creature.specie}
            </span>
          </Field>
          <Field label="Genus">{GENUS_LABELS[genus]}</Field>
          <Field label="Parent">
            {creature.parentId !== null
              ? `#${creature.parentId}, born in generation ${creature.parentBirthGen}`
              : "none (first generation, or loaded from a file)"}
          </Field>
        </Group>

        <Group title="Life">
          <Field label="Status">{isInWorld ? "Alive" : "Dead"}</Field>
          <Field label="Health">
            <Meter value={creature.health} max={maxHealth} text={`${Math.max(0, creature.health)} / ${maxHealth}`} />
          </Field>
          <Field label="Age">
            <Meter value={creature._age} max={creature.maxAge} text={`${creature._age} / ${creature.maxAge} steps`} />
          </Field>
          <Field label="Born">
            generation {creature.birthGen}, step {creature.stepBirth}
          </Field>
        </Group>

        <Group title="Body">
          <Field label="Mass">
            <Meter
              value={creature.mass}
              max={massData._maxMass}
              text={`${formatMass(creature.mass)} / ${formatMass(massData._maxMass)}`}
            />
          </Field>
          <Field label="Mass at birth">{formatMass(creature.massAtBirth)}</Field>
          {metabolismEnabled ? (
            <CostFields creature={creature} />
          ) : (
            <Field label="Metabolism">off: mass does not change</Field>
          )}
          <Field label="Enough mass to move">
            <YesNo value={creature.hasEnoughMassToMove()} />
          </Field>
          <Field label="Enough mass to reproduce">
            <YesNo value={creature.reproduction.hasEnoughtMassToReproduce} />
          </Field>
        </Group>

        <Group title="Movement">
          <Field label="Position">({x}, {y})</Field>
          <Field label="Last movement">
            ({creature.lastMovement[0]}, {creature.lastMovement[1]})
          </Field>
          <Field label="Direction">{creature.stepDirection ?? "stopped"}</Field>
          {/* the fitness of Greatest Distance selection, not the cells travelled */}
          <Field label="Distance index">{creature.distanceCovered}</Field>
          <Field label="Steps stopped">{creature.stepsStopped}</Field>
          {cell && (
            <Field label="Water in its cell">
              <Meter
                value={cell.water}
                max={cell.waterCapacity}
                text={`${cell.water.toFixed(2)} / ${cell.waterCapacity.toFixed(2)}`}
              />
            </Field>
          )}
        </Group>

        <Group title="Activity">
          <Field label="Children">{creature.childrenCount}</Field>
          {preyGenus && (
            <>
              <Field label="Attacks">{creature.attackCount}</Field>
              <Field label="Kills">{creature.killCount}</Field>
            </>
          )}
        </Group>

        {metabolismEnabled && (
          <Group title="Mass balance">
            <MassBalanceFields
              balance={creatureMassBalance(creature)}
              eatsPrey={preyGenus !== undefined}
              endLabel={isInWorld ? "= Mass now" : "= Mass at death"}
              realMass={isInWorld ? creature.mass : undefined}
            />
          </Group>
        )}

        <Group title="Brain">
          <GeneFields creature={creature} />
          <Field label="Neurons">{network.neurons.length}</Field>
          <Field label="Connections">{network.connections.length}</Field>
          <Field label="Stamina">
            {`${creature.brain.stamina.toFixed(2)} (thought in ${creature.thinkCount} of ${creature._age} steps)`}
          </Field>
          <Field label="Strongest action">
            {strongestAction >= 0
              ? `${actionLabels[strongestAction] ?? `Action ${strongestAction}`} ${formatWeight(network.outputs[strongestAction])}`
              : "none"}
          </Field>
        </Group>
      </div>
    </div>
  );
}
