"use client";

import { ReactNode } from "react";
import Creature from "@/simulation/creature/Creature";
import { MassBalance } from "@/simulation/generations/creatureQueries";
import { NETWORK_COLORS } from "./NetworkDiagram";

// Pieces shared by the creature and species panels

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

export function YesNo({ value }: { value: boolean }) {
  return (
    <span style={{ color: value ? NETWORK_COLORS.positive : NETWORK_COLORS.negative }}>
      {value ? "● yes" : "○ no"}
    </span>
  );
}

export const formatMass = (value: number) => value.toFixed(2);
const formatSigned = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;

// What the genes and brain of a creature cost; the same for every member of its species
export function CostFields({ creature }: { creature: Creature }) {
  const massData = creature._mass;
  return (
    <>
      <Field label="Basal consumption">{formatMass(massData._basalConsumption)} per step</Field>
      <Field label="Thinking cost">
        {creature.brain.stamina < 1
          ? `${formatMass(massData._thinkCost)} in each step it thinks`
          : `${formatMass(massData._thinkCost)} per step`}
      </Field>
    </>
  );
}

// The genes split by what they cost every step; the same for every member of its species
export function GeneFields({ creature }: { creature: Creature }) {
  const massData = creature._mass;
  const metabolismEnabled = massData._metabolismEnabled;
  const data = creature.generations.worldController.simData.worldControllerData;
  return (
    <>
      <Field label="Genes">{creature.brain.genome.genes.length}</Field>
      <Field label="Genes primary">
        {massData.genes.primary}
        {metabolismEnabled && ` (${formatMass(massData.genes.primary * data.MASS_BASAL_CONSUMPTION_PER_BRAIN_PRIMARY)} per step)`}
      </Field>
      <Field label="Genes stamina">{massData.genes.stamina}{metabolismEnabled && " (free)"}</Field>
      <Field label="Genes other">
        {massData.genes.other}
        {metabolismEnabled && ` (${formatMass(massData.genes.other * data.MASS_BASAL_CONSUMPTION_PER_BRAIN_SIZE)} per step)`}
      </Field>
    </>
  );
}

interface MassBalanceProps {
  balance: MassBalance;
  /** herbivores and carnivores: shows what they ate and what attacking cost */
  eatsPrey: boolean;
  endLabel: string;
  /** when given and different from the balance, it is shown in red */
  realMass?: number;
}

// The mass balance as a sum, from the mass at start to the mass now
export function MassBalanceFields({ balance, eatsPrey, endLabel, realMass }: MassBalanceProps) {
  const actions = balance.thinking + balance.moving + balance.attacking;
  const reproduction = balance.reproductionCost + balance.givenToChildren;
  return (
    <>
      <Field label="Mass at start">{formatMass(balance.start)}</Field>
      <Field label="+ Photosynthesis">{formatMass(balance.photosynthesis)}</Field>
      {eatsPrey && (
        <Field label="+ Eaten from prey">
          {`${formatMass(balance.fromPrey)} (net of attack cost ${formatSigned(balance.fromPrey - balance.attacking)})`}
        </Field>
      )}
      <Field label="− Basal (genes)">{formatMass(balance.basal)}</Field>
      <Field label="− Actions">
        {`${formatMass(actions)} (thinking ${formatMass(balance.thinking)}, moving ${formatMass(balance.moving)}${eatsPrey ? `, attacking ${formatMass(balance.attacking)}` : ""})`}
      </Field>
      <Field label="− Reproduction">
        {`${formatMass(reproduction)} (cost ${formatMass(balance.reproductionCost)}, given to children ${formatMass(balance.givenToChildren)})`}
      </Field>
      <Field label={endLabel}>
        {formatMass(balance.end)}
        {realMass !== undefined && Math.abs(balance.end - realMass) > 0.005 && (
          <span className="text-red"> (its mass is {formatMass(realMass)})</span>
        )}
      </Field>
    </>
  );
}
