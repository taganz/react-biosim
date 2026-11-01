"use client";

import { useId } from "react";

export type SpeciesOrderKey = "creatures" | "genomeSize";

interface Props {
  order: SpeciesOrderKey;
  onChange: (order: SpeciesOrderKey) => void;
}

// Chooses which species come first in the list of boxes
export default function SpeciesOrder({ order, onChange }: Props) {
  const id = useId();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={id} className="text-sm">
        Order species by
      </label>
      <select
        id={id}
        value={order}
        onChange={(e) => onChange(e.target.value as SpeciesOrderKey)}
        className="min-w-0 bg-grey-mid p-1 text-sm"
      >
        <option value="creatures">Number of creatures</option>
        <option value="genomeSize">Genome size</option>
      </select>
    </div>
  );
}
