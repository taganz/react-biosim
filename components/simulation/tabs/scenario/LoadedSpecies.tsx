"use client";

import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { FaCheck, FaClipboard, FaCode, FaPlus } from "react-icons/fa";
import Button from "@/components/global/Button";
import { loadedSpeciesAtom, simulationDataAtom } from "@/components/simulation/store";
import Genome from "@/simulation/creature/brain/Genome";
import ScenarioSection from "./ScenarioSection";

// a number for each loaded file, so its section is mounted again, and open, after every load
const loadIds = new WeakMap<object, number>();
const getLoadId = (loaded: object) => {
  if (!loadIds.has(loaded)) loadIds.set(loaded, nextLoadId++);
  return loadIds.get(loaded)!;
};
let nextLoadId = 0;

// The species with most creatures in the last loaded file, with their genome to copy (in hexadecimal,
// or as a JSON entry of POPULATION_DEFAULT_SPECIES) or to add to the species of generation 1
// (POPULATION_DEFAULT_SPECIES, used by the Default Species strategy)
export default function LoadedSpecies() {
  const loaded = useAtomValue(loadedSpeciesAtom);
  const setSimulationData = useSetAtom(simulationDataAtom);
  // the genomes added in this session, to show they were added
  const [added, setAdded] = useState<Set<string>>(() => new Set());
  // what was copied last ("hex:" or "json:" and the genome), to show it was copied
  const [copied, setCopied] = useState<string | null>(null);

  if (!loaded) return null;
  const { sourceName, summary } = loaded;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(
      () => setCopied(key),
      (error) => console.error("Could not copy the genome:", error)
    );
  };

  // the name a species gets in POPULATION_DEFAULT_SPECIES: the file and its place in the list
  const speciesName = (index: number) => `${sourceName.replace(/^"(.*)"$/, "$1")} #${index + 1}`;

  const addToDefaultSpecies = (genome: Genome, name: string) => {
    setSimulationData((prev) => ({
      ...prev,
      constants: {
        ...prev.constants,
        POPULATION_DEFAULT_SPECIES: [
          ...(prev.constants?.POPULATION_DEFAULT_SPECIES ?? []),
          { name, genome: genome.genes.slice() },
        ],
      },
    }));
    setAdded((prev) => new Set(prev).add(genome.toHexadecimalString()));
  };

  return (
    <ScenarioSection
      key={getLoadId(loaded)}
      id="species"
      defaultOpen
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
                  icon={copied === `hex:${hex}` ? <FaCheck className="inline-block" /> : <FaClipboard className="inline-block" />}
                  aria-label="Copy genome"
                  title={copied === `hex:${hex}` ? "Copied" : "Copy genome"}
                  className="shrink-0"
                  onClick={() => copy(hex, `hex:${hex}`)}
                />
                <Button
                  variant="dark"
                  icon={copied === `json:${hex}` ? <FaCheck className="inline-block" /> : <FaCode className="inline-block" />}
                  aria-label="Copy as JSON for POPULATION_DEFAULT_SPECIES"
                  title={copied === `json:${hex}` ? "Copied" : "Copy as JSON, to paste in the list of POPULATION_DEFAULT_SPECIES"}
                  className="shrink-0"
                  onClick={() => copy(JSON.stringify({ name: speciesName(index), genome: genome.genes }), `json:${hex}`)}
                />
                <Button
                  variant="dark"
                  icon={added.has(hex) ? <FaCheck className="inline-block" /> : <FaPlus className="inline-block" />}
                  aria-label="Add to the species of generation 1"
                  title={added.has(hex) ? "Added to the species of generation 1" : "Add to the species of generation 1 (Default Species strategy)"}
                  className="shrink-0"
                  onClick={() => addToDefaultSpecies(genome, speciesName(index))}
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
    </ScenarioSection>
  );
}
