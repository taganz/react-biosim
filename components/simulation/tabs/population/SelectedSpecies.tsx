import { useAtomValue } from "jotai";
import { worldControllerAtom } from "../../store";
import { useMemo } from "react";
import { Species } from "../../../../simulation/creature/Species";
import CopyToClipboardTextarea from "@/components/global/inputs/CopyToClipboardTextarea";
import SelectedCreaturedInfo from "./SelectedCreatureInfo";
import NetworkDiagram, { NetworkLegend } from "./NetworkDiagram";
import NetworkInfluenceTable from "./NetworkInfluenceTable";
import { getNetworkLabels } from "@/simulation/creature/brain/Helpers/networkLabels";
import { computeInfluences } from "@/simulation/creature/brain/Helpers/networkInfluence";
import { initialNeuronOutput } from "@/simulation/creature/brain/CreatureBrain";

interface Props {
  species: Species[];
  selectedSpecies?: Species;
}

export default function SelectedSpeciesPanel({
  species,
  selectedSpecies,
}: Props) {
  const worldController = useAtomValue(worldControllerAtom);

  const actualSelectedSpecies =
    selectedSpecies &&
    species.find((item) => item.genomeKey === selectedSpecies.genomeKey);

  const aliveCreatures =
    (actualSelectedSpecies && actualSelectedSpecies.creatures.length) ?? 0;

  const populationPercentage = (
    actualSelectedSpecies && worldController
      ? (actualSelectedSpecies.creatures.length / worldController.initialPopulation) * 100
      : 0
  ).toFixed(2);

  // every creature of a species shares the genome, so any of them has the species network
  const brainView = useMemo(() => {
    const creature = selectedSpecies?.creatures[0];
    if (!creature) return undefined;
    const network = creature.brain.brain;
    return {
      network,
      labels: getNetworkLabels(creature),
      influences: computeInfluences(network, initialNeuronOutput),
    };
  }, [selectedSpecies]);

  return (
    <>
      {selectedSpecies && worldController ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-center text-2xl font-bold">
            Selected species{" "}
            <span
              className="text-shadow-sm inline-block p-1"
              style={{ backgroundColor: selectedSpecies.genome.getColor() }}
            >
              {selectedSpecies.genome.getHexColor()}
            </span>
          </h3>

          <div>
            {actualSelectedSpecies ? (
              <>
                <div>
                  <strong>Alive creatures:</strong> {aliveCreatures}
                </div>

                <div>
                  <strong>Population percentage:</strong> {populationPercentage}
                  %
                </div>
              </>
            ) : (
              <p className="bg-red p-4">This species went extinct.</p>
            )}
          </div>

          {brainView && (
            <>
              <section className="flex flex-col gap-2">
                <h4 className="text-xl font-bold">Neuronal network</h4>
                <NetworkDiagram
                  network={brainView.network}
                  sensorLabels={brainView.labels.sensors}
                  actionLabels={brainView.labels.actions}
                />
                <NetworkLegend />
              </section>

              <section className="flex flex-col gap-2">
                <h4 className="text-xl font-bold">What drives each action</h4>
                <NetworkInfluenceTable
                  influences={brainView.influences}
                  sensorLabels={brainView.labels.sensors}
                  actionLabels={brainView.labels.actions}
                />
              </section>
            </>
          )}

          <div>
            <div>
              <strong>Genome size:</strong>{" "}
              {selectedSpecies.genome.genes.length}
            </div>

            <div>
              <strong>Hexadecimal genome:</strong>
              <br />
              <CopyToClipboardTextarea
                value={selectedSpecies.genome.toHexadecimalString()}
              />
            </div>

            <div>
              <strong>Binary genome:</strong>
              <br />
              <CopyToClipboardTextarea
                value={selectedSpecies.genome.toBitString()}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex max-w-md flex-col gap-6 text-lg">
          <p className="mb-2">
            The colorful boxes to the right are the top species on the current
            generation. The list is ordered by population.
          </p>
          <p>
            Click one of the boxes to see more information about that species
            (genes, neuronal network, etc).
          </p>
        </div>
      )}
      <div>
      <SelectedCreaturedInfo creature={worldController!.generations.currentCreatures[0]}></SelectedCreaturedInfo>

      </div>
    </>
  );
}
