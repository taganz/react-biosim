"use client";

import { ReactNode, useMemo } from "react";
import Creature, { DeathCause, maxHealth } from "@/simulation/creature/Creature";
import useWorldValue from "@/hooks/useWorldValue";
import { getNetworkLabels } from "@/simulation/creature/brain/Helpers/networkLabels";
import { GENUS_LABELS } from "./genusLabels";
import { formatWeight, NETWORK_COLORS } from "./NetworkDiagram";

interface Props {
  creature: Creature;
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h5 className="mb-1 font-bold">{title}</h5>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm tabular-nums">{children}</dl>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-grey-light">{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

// a value with a bar that shows how full it is
export function Meter({ value, max, text }: { value: number; max: number; text: string }) {
  const fraction = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className="inline-block h-2 w-20 shrink-0 rounded-sm bg-grey-mid">
        <span className="block h-2 rounded-sm bg-grey-light" style={{ width: `${fraction * 100}%` }} />
      </span>
      <span className="whitespace-nowrap">{text}</span>
    </span>
  );
}

function YesNo({ value }: { value: boolean }) {
  return (
    <span style={{ color: value ? NETWORK_COLORS.positive : NETWORK_COLORS.negative }}>
      {value ? "● yes" : "○ no"}
    </span>
  );
}

const formatMass = (value: number) => value.toFixed(2);

const DEATH_CAUSES: Record<DeathCause, string> = {
  old: "old age",
  basalConsumption: "ran out of mass (basal consumption)",
  attacked: "eaten",
  health: "health reached 0",
  unknown: "unknown cause",
};

function deathText(creature: Creature): string {
  if (creature.deathCause === null) {
    // generational runs replace the creatures without killing them
    return "Not in the world anymore: it was replaced by a new generation or run.";
  }
  const killer = creature.deathCause === "attacked" && creature.killedBySpecies
    ? ` by a creature of species ${creature.killedBySpecies}`
    : "";
  return `Died of ${DEATH_CAUSES[creature.deathCause]}${killer} at generation ${creature.deathGen}, step ${creature.deathStep}. The values are from its last step.`;
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
            <Field label="Basal consumption">{formatMass(massData._basalConsumption)} per step</Field>
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
          {metabolismEnabled && (
            <Field label="Water from photosynthesis">{formatMass(creature.waterFromPhotosynthesis)}</Field>
          )}
          {metabolismEnabled && preyGenus && (
            <Field label="Water from prey">{formatMass(creature.waterFromPrey)}</Field>
          )}
        </Group>

        <Group title="Brain">
          <Field label="Genes">{creature.brain.genome.genes.length}</Field>
          <Field label="Neurons">{network.neurons.length}</Field>
          <Field label="Connections">{network.connections.length}</Field>
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
