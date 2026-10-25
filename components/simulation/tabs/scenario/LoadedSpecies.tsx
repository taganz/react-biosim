"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { FaCheck, FaClipboard } from "react-icons/fa";
import Button from "@/components/global/Button";
import { loadedSpeciesAtom } from "@/components/simulation/store";
import Section from "../Section";

// The species with most creatures in the last loaded file, with their genome to copy
export default function LoadedSpecies() {
  const loaded = useAtomValue(loadedSpeciesAtom);
  // the genome copied last, to show it was copied
  const [copied, setCopied] = useState<string | null>(null);

  if (!loaded) return null;
  const { sourceName, summary } = loaded;

  const copy = (genome: string) => {
    navigator.clipboard.writeText(genome).then(
      () => setCopied(genome),
      (error) => console.error("Could not copy the genome:", error)
    );
  };

  return (
    <Section
      title="Top species in the loaded file"
      description={
        summary.totalCreatures > 0
          ? `${sourceName}: ${summary.totalCreatures} creatures of ${summary.totalSpecies} species. ` +
            `Up to 10 with most creatures and at least 1% of them, with their share of all the creatures.`
          : `${sourceName} has no creatures: it is a setup, so the run starts with random genomes.`
      }
    >
      {summary.top.length > 0 && (
        <ol className="flex flex-col gap-2">
          {summary.top.map(({ genome, creatures, percentage }, index) => {
            const hex = genome.toHexadecimalString();
            return (
              <li key={hex} className="flex items-start gap-3 border border-grey-mid p-2">
                <span className="w-6 shrink-0 text-right tabular-nums">{index + 1}.</span>
                <span
                  className="mt-1 h-4 w-4 shrink-0 rounded-sm"
                  style={{ backgroundColor: genome.getColor() }}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="tabular-nums">
                    <strong>{percentage.toFixed(2)}%</strong> · {creatures} creatures · {genome.genes.length} genes
                  </span>
                  <code className="word-spacing-md break-all text-xs">{hex}</code>
                </div>
                <Button
                  variant="dark"
                  icon={copied === hex ? <FaCheck className="inline-block" /> : <FaClipboard className="inline-block" />}
                  aria-label="Copy genome"
                  title={copied === hex ? "Copied" : "Copy genome"}
                  className="shrink-0"
                  onClick={() => copy(hex)}
                />
              </li>
            );
          })}
        </ol>
      )}
      {summary.rest.species > 0 && (
        <p className="tabular-nums">
          {summary.top.length > 0 ? "Other: " : "All under 1%: "}
          {summary.rest.species} species {summary.rest.percentage.toFixed(2)}% {summary.rest.creatures} creatures
        </p>
      )}
    </Section>
  );
}
