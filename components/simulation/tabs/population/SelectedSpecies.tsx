import { useAtomValue, useAtom } from "jotai";
import { worldControllerAtom, selectedCreatureAtom, selectedCellAtom } from "../../store";
import { useMemo, useState } from "react";
import { Species } from "../../../../simulation/creature/Species";
import CopyToClipboardTextarea from "@/components/global/inputs/CopyToClipboardTextarea";
import SelectedCreatureInfo from "./SelectedCreatureInfo";
import SelectedCellInfo from "./SelectedCellInfo";
import NetworkDiagram, { NetworkLegend } from "./NetworkDiagram";
import NetworkInfluenceTable from "./NetworkInfluenceTable";
import LiveNetworkDiagram from "./LiveNetworkDiagram";
import CollapsibleSection from "./CollapsibleSection";
import CreatureToolbar from "./CreatureToolbar";
import { ToggleGroup } from "@/components/global/ToggleGroup";
import Toggle from "@/components/global/Toggle";
import { getNetworkLabels } from "@/simulation/creature/brain/Helpers/networkLabels";
import { computeInfluences } from "@/simulation/creature/brain/Helpers/networkInfluence";
import { initialNeuronOutput } from "@/simulation/creature/brain/CreatureBrain";
import { GENUS_LABELS } from "./genusLabels";

interface Props {
  species: Species[];
  selectedSpecies?: Species;
}

export default function SelectedSpeciesPanel({
  species,
  selectedSpecies,
}: Props) {
  const worldController = useAtomValue(worldControllerAtom);
  const [selectedCreature, setSelectedCreature] = useAtom(selectedCreatureAtom);
  const [selectedCell, setSelectedCell] = useAtom(selectedCellAtom);
  const [networkView, setNetworkView] = useState<"live" | "structure">("live");

  const actualSelectedSpecies =
    selectedSpecies &&
    species.find((item) => item.genomeKey === selectedSpecies.genomeKey);

  const aliveCreatures = actualSelectedSpecies?.creatures.length ?? 0;

  // the species list is grouped at the start of the generation, so the percentage uses
  // the creatures alive at that moment
  const totalCreatures = species.reduce((total, item) => total + item.creatures.length, 0);
  const populationPercentage = (
    totalCreatures > 0 ? (aliveCreatures / totalCreatures) * 100 : 0
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

  // live values are only available for a creature clicked on the canvas that belongs to this species
  const liveCreature =
    selectedCreature &&
    selectedSpecies &&
    selectedCreature.brain.genome.toDecimalString(false) === selectedSpecies.genomeKey
      ? selectedCreature
      : undefined;
  const showLive = liveCreature !== undefined && networkView === "live";

  const genus = selectedSpecies?.creatures[0]?.genus ?? "unknown";

  if (!worldController || (!selectedSpecies && !selectedCreature && !selectedCell)) {
    return (
      <div className="flex max-w-md flex-col gap-6 text-lg">
        <p className="mb-2">
          The colorful boxes to the right are the top species on the current
          generation. The list is ordered by population.
        </p>
        <p>
          Click one of the boxes to see more information about that species
          (genes, neuronal network, etc). Click a creature on the world to see
          its own state, or an empty cell to see its water and map objects.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* what is selected, at a glance */}
      <div className="flex flex-wrap items-center gap-2">
        {selectedSpecies && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-grey-mid p-2">
            <span
              className="text-shadow-sm px-1 text-lg font-bold"
              style={{ backgroundColor: selectedSpecies.getColor() }}
            >
              {selectedSpecies.genome.getHexColor()}
            </span>
            {genus !== "unknown" && <span>{GENUS_LABELS[genus]}</span>}
            {actualSelectedSpecies ? (
              <span className="tabular-nums">
                {aliveCreatures} alive · {populationPercentage}%
              </span>
            ) : (
              <span className="bg-red px-1">Extinct</span>
            )}
          </div>
        )}
        {selectedCreature && (
          <div className="flex items-center gap-2 border border-grey-mid p-2">
            <span>Creature #{selectedCreature.id}</span>
            <button
              className="px-1 hover:bg-grey-mid"
              aria-label="Clear the selected creature"
              title="Clear the selected creature"
              onClick={() => setSelectedCreature(null)}
            >
              ×
            </button>
          </div>
        )}
        {selectedCell && (
          <div className="flex items-center gap-2 border border-grey-mid p-2">
            <span>Cell ({selectedCell[0]}, {selectedCell[1]})</span>
            <button
              className="px-1 hover:bg-grey-mid"
              aria-label="Clear the selected cell"
              title="Clear the selected cell"
              onClick={() => setSelectedCell(null)}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {selectedCell && (
        <CollapsibleSection title={`Cell (${selectedCell[0]}, ${selectedCell[1]})`} defaultOpen>
          <SelectedCellInfo position={selectedCell} />
        </CollapsibleSection>
      )}

      {selectedCreature && (
        <CollapsibleSection title={`Creature #${selectedCreature.id}`} defaultOpen>
          {/* remounted for each creature, so a log message does not carry over */}
          <CreatureToolbar key={`${selectedCreature.birthGen}-${selectedCreature.id}`} creature={selectedCreature} />
          <SelectedCreatureInfo creature={selectedCreature} />
        </CollapsibleSection>
      )}

      {selectedSpecies && brainView && (
        <>
          <CollapsibleSection title="Neuronal network" defaultOpen>
            {liveCreature ? (
              <ToggleGroup
                role="group"
                aria-label="Network view"
                value={networkView}
                onChange={setNetworkView}
              >
                <Toggle value="live">Live values</Toggle>
                <Toggle value="structure">Structure</Toggle>
              </ToggleGroup>
            ) : (
              <p className="text-xs">
                Click a creature of this species on the world to see its live network values.
              </p>
            )}
            {showLive ? (
              <LiveNetworkDiagram
                creature={liveCreature}
                sensorLabels={brainView.labels.sensors}
                actionLabels={brainView.labels.actions}
              />
            ) : (
              <>
                <NetworkDiagram
                  network={brainView.network}
                  sensorLabels={brainView.labels.sensors}
                  actionLabels={brainView.labels.actions}
                />
                <NetworkLegend />
              </>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="What drives each action" defaultOpen>
            <NetworkInfluenceTable
              influences={brainView.influences}
              sensorLabels={brainView.labels.sensors}
              actionLabels={brainView.labels.actions}
            />
          </CollapsibleSection>
        </>
      )}

      {selectedSpecies && (
        <CollapsibleSection title="Genome">
          <div>
            <strong>Genome size:</strong> {selectedSpecies.genome.genes.length}
          </div>

          <div>
            <strong>Hexadecimal genome:</strong>
            <br />
            <CopyToClipboardTextarea value={selectedSpecies.genome.toHexadecimalString()} />
          </div>

          <div>
            <strong>Binary genome:</strong>
            <br />
            <CopyToClipboardTextarea value={selectedSpecies.genome.toBitString()} />
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
