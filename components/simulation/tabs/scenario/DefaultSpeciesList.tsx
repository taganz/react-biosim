"use client";

import { useAtom } from "jotai";
import { FaTrash } from "react-icons/fa";
import Button from "@/components/global/Button";
import Genome from "@/simulation/creature/brain/Genome";
import { simulationDataAtom } from "../../store";
import { CONSTANTS_DEFAULT } from "@/simulation/constantsDefault";

type SpeciesList = typeof CONSTANTS_DEFAULT["POPULATION_DEFAULT_SPECIES"];

// The genomes of generation 1 for the Default Species strategy (constants.POPULATION_DEFAULT_SPECIES in the draft)
export default function DefaultSpeciesList() {
  const [simulationData, setSimulationData] = useAtom(simulationDataAtom);
  const species: SpeciesList = simulationData.constants?.POPULATION_DEFAULT_SPECIES ?? [];
  const population = simulationData.worldGenerationsData.initialPopulation;

  const remove = (index: number) => {
    setSimulationData((prev) => ({
      ...prev,
      constants: {
        ...prev.constants,
        POPULATION_DEFAULT_SPECIES: (prev.constants?.POPULATION_DEFAULT_SPECIES as SpeciesList ?? []).filter((_, i) => i !== index),
      },
    }));
  };

  // creature i gets species i mod n, so the first ones get one more when it does not divide evenly
  const creaturesOf = (index: number) =>
    Math.floor(population / species.length) + (index < population % species.length ? 1 : 0);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-grey-mid p-3">
      <h4 className="font-bold">Species of generation 1</h4>
      <p className="text-xs">
        Generation 1 is made of these genomes, copied without mutation, in equal shares. Later generations
        are children of the survivors, as in Asexual Zone. Add species with the + button of
        &quot;Top species in the loaded file&quot;, or edit POPULATION_DEFAULT_SPECIES under Constants. Genes
        refer to sensors and actions by their position among the enabled ones, so keep the same ones enabled
        as in the run the genomes come from. Apply changes with Restart.
      </p>
      {species.length > 0 ? (
        <ol className="flex flex-col gap-2">
          {species.map(({ name, genome }, index) => {
            const g = new Genome(genome);
            return (
              <li key={index} className="flex items-start gap-3 border border-grey-mid p-2">
                <span
                  className="mt-1 h-4 w-4 shrink-0 rounded-sm"
                  style={{ backgroundColor: g.getColor() }}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="break-all">{name || `Species ${index + 1}`}</span>
                  <span className="text-xs tabular-nums">
                    {genome.length} {genome.length === 1 ? "gene" : "genes"} · {creaturesOf(index)} creatures
                  </span>
                </div>
                <Button
                  variant="dark"
                  icon={<FaTrash className="inline-block" />}
                  aria-label={`Remove ${name || `species ${index + 1}`}`}
                  title="Remove"
                  className="shrink-0"
                  onClick={() => remove(index)}
                />
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="bg-red p-2 text-sm">
          The list is empty, so generation 1 gets random genomes, as in Asexual Zone.
        </p>
      )}
    </div>
  );
}
