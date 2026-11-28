"use client";

import { useState } from "react";
import { FaCheck, FaClipboard, FaCode, FaTimes, FaTrash } from "react-icons/fa";
import Button from "@/components/global/Button";
import NetworkDiagram, { NETWORK_COLORS, NetworkLegend, formatWeight } from "@/components/simulation/tabs/population/NetworkDiagram";
import { GENUS_LABELS } from "@/components/simulation/tabs/population/genusLabels";
import { Gene } from "@/simulation/creature/brain/Genome";
import { ConnectionType } from "@/simulation/creature/brain/Connection";
import { NeuronType } from "@/simulation/creature/brain/Neuron";
import CreatureBrain from "@/simulation/creature/brain/CreatureBrain";
import {
  EditorContext, Endpoint, GeneRow, MAX_WEIGHT, MIN_WEIGHT, addGene, addNeuron, checkConnection, describeGenome,
  freeNeuronId, geneToHex, parseGenomeText, removeAction, removeGeneAt, removeNeuron, removeSensor, replaceGene,
  setGeneWeight, thinkCost, usedNeuronIds,
} from "@/simulation/creature/brain/genomeEditing";
import { SavedSimulationData } from "@/simulation/serialization/data/SavedSimulationData";
import { GenomeEntry } from "@/simulation/serialization/genomeFile";

const { SENSOR, ACTION, NEURON } = NeuronType;

interface Props {
  entry: GenomeEntry;
  genes: Gene[];
  context: EditorContext;
  data: SavedSimulationData;
  edited: boolean;
  canUndo: boolean;
  onChange: (genes: Gene[], tag?: string) => void;
  onUndo: () => void;
  onRevert: () => void;
  copied: string | null;
  onCopyHex: () => void;
  onCopyJson: () => void;
}

// endpoints in the selects: "s<id>" a sensor, "n<id>" a neuron, "a<id>" an action
const sourceKey = (c: ConnectionType) => `${c.sourceType === SENSOR ? "s" : "n"}${c.sourceId}`;
const sinkKey = (c: ConnectionType) => `${c.sinkType === ACTION ? "a" : "n"}${c.sinkId}`;
const parseSource = (key: string): Endpoint => ({ type: key[0] === "s" ? SENSOR : NEURON, id: Number(key.slice(1)) });
const parseSink = (key: string): Endpoint => ({ type: key[0] === "a" ? ACTION : NEURON, id: Number(key.slice(1)) });

const ROLE_LABELS: Record<GeneRow["role"], { text: string; title: string }> = {
  connection: { text: "used", title: "A connection of the brain" },
  pruned: { text: "pruned", title: "The engine deletes it when it builds the brain: its neuron has no way to an action" },
  stamina: { text: "stamina", title: "Drives the Stamina action: its weight gives the share of steps in which the brain runs" },
};

export default function GenomeEditor({
  entry, genes, context, data, edited, canUndo, onChange, onUndo, onRevert, copied, onCopyHex, onCopyJson,
}: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const view = describeGenome(genes, context);
  const { counts, sensorLabels, actionLabels, staminaId } = context;
  const controller = data.worldControllerData;
  const maxGenomeSize = data.worldGenerationsData.maxGenomeSize;

  const neuronIds = [...Array(counts.maxNeurons).keys()];
  const sensorOptions = sensorLabels.map((label, id) => ({ key: `s${id}`, label }));
  const neuronOptions = neuronIds.map((id) => ({ key: `n${id}`, label: `N${id}` }));
  // Stamina is not a connection: its gene is only edited by its weight
  const actionOptions = actionLabels.map((label, id) => ({ key: `a${id}`, label })).filter((_, id) => id !== staminaId);
  const canUseSensors = sensorOptions.length > 0;
  const canUseActions = actionOptions.length > 0;

  const change = (next: Gene[] | null, tag?: string) => {
    if (next === null) {
      setMessage("A genome needs at least one gene: that would delete all of them.");
      return;
    }
    setMessage(null);
    onChange(next, tag);
  };

  const changeConnection = (row: GeneRow, changes: Partial<ConnectionType>) => {
    const connection = { ...row.connection, ...changes };
    const problem = checkConnection(connection, context);
    if (problem) return setMessage(problem);
    change(replaceGene(genes, row.index, connection));
  };

  // the parts of the brain, from every gene (also the pruned ones), to delete them at once
  const usedSensors = new Set<number>();
  const usedActions = new Set<number>();
  for (const { connection, role } of view.rows) {
    if (role === "stamina") continue;
    if (connection.sourceType === SENSOR) usedSensors.add(connection.sourceId);
    if (connection.sinkType === ACTION) usedActions.add(connection.sinkId);
  }
  const usedNeurons = usedNeuronIds(genes, context);

  const staminaRows = view.rows.filter((row) => row.role === "stamina");
  const stamina = staminaId >= 0
    ? CreatureBrain.staminaFromWeight(view.built.staminaWeight, controller)
    : undefined;
  const pruned = view.rows.filter((row) => row.role === "pruned").length;
  const cost = thinkCost(view.built, context, controller);

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-lg font-bold">
            {entry.label}
            {edited && <span className="ml-2 rounded bg-blue px-1 text-sm">edited</span>}
          </h2>
          <Button
            variant="grey"
            icon={copied === `hex:${entry.key}` ? <FaCheck className="inline-block" /> : <FaClipboard className="inline-block" />}
            onClick={onCopyHex}
            title="Copy the genes in hexadecimal, as the app copies them"
          >
            Copy genome
          </Button>
          <Button
            variant="grey"
            icon={copied === `json:${entry.key}` ? <FaCheck className="inline-block" /> : <FaCode className="inline-block" />}
            onClick={onCopyJson}
            title="Copy as a JSON entry of POPULATION_DEFAULT_SPECIES"
          >
            Copy JSON
          </Button>
          <Button variant="grey" onClick={onUndo} disabled={!canUndo}>Undo</Button>
          <Button variant="danger" onClick={onRevert} disabled={!edited} title="Back to the genes of the file">Revert</Button>
        </div>
        <p className="text-sm tabular-nums">
          {entry.creatures > 0 && `${entry.creatures} creatures · `}
          {GENUS_LABELS[view.genus]} · {genes.length} genes
          {maxGenomeSize !== undefined && genes.length > maxGenomeSize && (
            <span className="ml-1 bg-red px-1">more than Max genome size ({maxGenomeSize})</span>
          )}
          {" "}· {view.built.network.connections.length} connections, {view.built.network.neurons.length} neurons
          {pruned > 0 && ` · ${pruned} pruned gene${pruned === 1 ? "" : "s"}`}
          {stamina !== undefined && ` · stamina ${stamina.toFixed(2)}`}
          {cost > 0 && ` · think cost ${cost.toPrecision(3)} per step`}
          {entry.speciesId && <span className="ml-2 font-mono text-xs" title="Species id in the file">{entry.speciesId}</span>}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold">Brain</h3>
        <NetworkDiagram
          network={view.built.network}
          sensorLabels={sensorLabels}
          actionLabels={actionLabels}
          neuronLabels={view.neuronLabels}
        />
        <NetworkLegend />
        <p className="text-xs">
          As the simulation builds it: pruned genes are left out and Stamina is not drawn. Neurons keep their
          number in the genes, so the diagram and the table below use the same names.
        </p>
      </section>

      {message && <p role="alert" className="bg-red p-2 text-sm">{message}</p>}

      <section className="flex flex-col gap-2">
        <h3 className="font-bold">Parts</h3>
        <p className="text-xs">Removing a part deletes every gene that connects it.</p>
        <div className="flex flex-wrap gap-1 text-sm">
          {Array.from(usedSensors).sort((a, b) => a - b).map((id) => (
            <PartChip key={`s${id}`} kind="sensor" label={sensorLabels[id]} onRemove={() => change(removeSensor(genes, context, id))} />
          ))}
          {usedNeurons.map((id) => (
            <PartChip key={`n${id}`} kind="neuron" label={`N${id}`} onRemove={() => change(removeNeuron(genes, context, id))} />
          ))}
          {Array.from(usedActions).sort((a, b) => a - b).map((id) => (
            <PartChip key={`a${id}`} kind="action" label={actionLabels[id]} onRemove={() => change(removeAction(genes, context, id))} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold">Genes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-1">#</th>
                <th className="p-1">From</th>
                <th className="p-1">To</th>
                <th className="p-1">Weight</th>
                <th className="p-1">Role</th>
                <th className="p-1">Gene</th>
                <th className="p-1"><span className="sr-only">Delete</span></th>
              </tr>
            </thead>
            <tbody>
              {view.rows.map((row) => (
                <tr key={row.index} className={row.role === "pruned" ? "opacity-60" : undefined}>
                  <td className="p-1 tabular-nums">{row.index + 1}</td>
                  <td className="p-1">
                    {row.role === "stamina" ? "—" : (
                      <EndpointSelect
                        label={`From, gene ${row.index + 1}`}
                        value={sourceKey(row.connection)}
                        groups={[["Sensors", sensorOptions], ["Neurons", neuronOptions]]}
                        onChange={(key) => {
                          const source = parseSource(key);
                          changeConnection(row, { sourceType: source.type, sourceId: source.id });
                        }}
                      />
                    )}
                  </td>
                  <td className="p-1">
                    {row.role === "stamina" ? "Stamina" : (
                      <EndpointSelect
                        label={`To, gene ${row.index + 1}`}
                        value={sinkKey(row.connection)}
                        groups={[["Neurons", neuronOptions], ["Actions", actionOptions]]}
                        onChange={(key) => {
                          const sink = parseSink(key);
                          changeConnection(row, { sinkType: sink.type, sinkId: sink.id });
                        }}
                      />
                    )}
                  </td>
                  <td className="p-1">
                    <WeightInput
                      label={`Weight, gene ${row.index + 1}`}
                      value={row.connection.weight}
                      onChange={(weight) => change(setGeneWeight(genes, row.index, weight), `weight:${row.index}`)}
                    />
                  </td>
                  <td className="p-1">
                    <span
                      className={row.role === "connection" ? "" : "italic"}
                      title={ROLE_LABELS[row.role].title}
                    >
                      {ROLE_LABELS[row.role].text}
                      {row.role === "stamina" && staminaRows[0] !== row && " (ignored)"}
                    </span>
                  </td>
                  <td className="p-1 font-mono text-xs">{geneToHex(row.gene)}</td>
                  <td className="p-1">
                    <Button
                      variant="dark"
                      icon={<FaTrash className="inline-block" />}
                      aria-label={`Delete gene ${row.index + 1}`}
                      title="Delete this gene"
                      onClick={() => change(removeGeneAt(genes, context, row.index))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <AddConnection
          sourceGroups={[["Sensors", sensorOptions], ["Neurons", neuronOptions]]}
          sinkGroups={[["Neurons", neuronOptions], ["Actions", actionOptions]]}
          defaultSource={canUseSensors ? "s0" : "n0"}
          defaultSink={canUseActions ? actionOptions[0].key : "n0"}
          onAdd={(source, sink, weight) => {
            const connection = { sourceType: source.type, sourceId: source.id, sinkType: sink.type, sinkId: sink.id, weight };
            const problem = checkConnection(connection, context);
            if (problem) return setMessage(problem);
            change(addGene(genes, connection));
          }}
        />
        <AddNeuron
          freeNeuron={freeNeuronId(genes, context)}
          sourceGroups={[["Sensors", sensorOptions], ["Neurons", neuronOptions]]}
          sinkGroups={[["Actions", actionOptions], ["Neurons", neuronOptions]]}
          defaultSource={canUseSensors ? "s0" : "n0"}
          defaultSink={canUseActions ? actionOptions[0].key : "n0"}
          onAdd={(source, sink, weightIn, weightOut) => {
            const result = addNeuron(genes, context, source, sink, weightIn, weightOut);
            if (!result) return setMessage("Every neuron number below Max neurons is used.");
            change(result.genes);
          }}
        />
      </div>

      <PasteGenome onReplace={(text) => {
        try {
          change(parseGenomeText(text));
        } catch (err) {
          setMessage(`Could not read the genome: ${err instanceof Error ? err.message : String(err)}`);
        }
      }} />
    </div>
  );
}

const PART_COLORS = { sensor: NETWORK_COLORS.sensor, neuron: NETWORK_COLORS.neuron, action: NETWORK_COLORS.action };

function PartChip({ kind, label, onRemove }: { kind: keyof typeof PART_COLORS; label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded border px-2 py-0.5" style={{ borderColor: PART_COLORS[kind] }}>
      {label}
      <button type="button" aria-label={`Remove ${kind} ${label}`} title={`Remove ${label}: delete its genes`} onClick={onRemove}>
        <FaTimes className="inline-block" />
      </button>
    </span>
  );
}

type OptionGroup = [string, { key: string; label: string }[]];

function EndpointSelect({ label, value, groups, onChange }: {
  label: string;
  value: string;
  groups: OptionGroup[];
  onChange: (key: string) => void;
}) {
  return (
    <select aria-label={label} className="max-w-48 bg-grey-mid p-1" value={value} onChange={(e) => onChange(e.target.value)}>
      {groups.filter(([, options]) => options.length > 0).map(([name, options]) => (
        <optgroup key={name} label={name}>
          {options.map(({ key, label: text }) => <option key={key} value={key}>{text}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

// a slider and a number field; the gene keeps the weight in steps of 1/8192
function WeightInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        aria-label={label}
        min={MIN_WEIGHT}
        max={MAX_WEIGHT}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24"
        style={{ accentColor: value >= 0 ? NETWORK_COLORS.positive : NETWORK_COLORS.negative }}
      />
      <input
        type="number"
        aria-label={label}
        className="w-20 bg-grey-mid p-1 tabular-nums"
        min={MIN_WEIGHT}
        max={4}
        step={0.01}
        value={text ?? value.toFixed(3)}
        onFocus={() => setText(value.toFixed(3))}
        onChange={(e) => {
          setText(e.target.value);
          const parsed = Number(e.target.value);
          if (e.target.value.trim() !== "" && Number.isFinite(parsed)) onChange(parsed);
        }}
        onBlur={() => setText(null)}
        title={formatWeight(value)}
      />
    </div>
  );
}

function WeightField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="flex flex-col text-sm">
      {label}
      <input
        type="number"
        className="w-24 bg-grey-mid p-1"
        min={MIN_WEIGHT}
        max={4}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function AddConnection({ sourceGroups, sinkGroups, defaultSource, defaultSink, onAdd }: {
  sourceGroups: OptionGroup[];
  sinkGroups: OptionGroup[];
  defaultSource: string;
  defaultSink: string;
  onAdd: (source: Endpoint, sink: Endpoint, weight: number) => void;
}) {
  const [source, setSource] = useState(defaultSource);
  const [sink, setSink] = useState(defaultSink);
  const [weight, setWeight] = useState(1);
  return (
    <section className="flex flex-col gap-2 border border-grey-mid p-3">
      <h3 className="font-bold">Add a connection</h3>
      <p className="text-xs">Adds one gene. A new sensor or action is added by connecting it.</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col text-sm">From<EndpointSelect label="From" value={source} groups={sourceGroups} onChange={setSource} /></label>
        <label className="flex flex-col text-sm">To<EndpointSelect label="To" value={sink} groups={sinkGroups} onChange={setSink} /></label>
        <WeightField label="Weight" value={weight} onChange={setWeight} />
        <Button variant="primary" onClick={() => onAdd(parseSource(source), parseSink(sink), weight)}>Add</Button>
      </div>
    </section>
  );
}

function AddNeuron({ freeNeuron, sourceGroups, sinkGroups, defaultSource, defaultSink, onAdd }: {
  freeNeuron: number;
  sourceGroups: OptionGroup[];
  sinkGroups: OptionGroup[];
  defaultSource: string;
  defaultSink: string;
  onAdd: (source: Endpoint, sink: Endpoint, weightIn: number, weightOut: number) => void;
}) {
  const [source, setSource] = useState(defaultSource);
  const [sink, setSink] = useState(defaultSink);
  const [weightIn, setWeightIn] = useState(1);
  const [weightOut, setWeightOut] = useState(1);
  return (
    <section className="flex flex-col gap-2 border border-grey-mid p-3">
      <h3 className="font-bold">Add a neuron</h3>
      <p className="text-xs">
        {freeNeuron < 0
          ? "Every neuron number below Max neurons is used."
          : `Adds neuron N${freeNeuron} with two genes: from → N${freeNeuron} and N${freeNeuron} → to.`}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col text-sm">From<EndpointSelect label="Neuron input" value={source} groups={sourceGroups} onChange={setSource} /></label>
        <WeightField label="Weight in" value={weightIn} onChange={setWeightIn} />
        <label className="flex flex-col text-sm">To<EndpointSelect label="Neuron output" value={sink} groups={sinkGroups} onChange={setSink} /></label>
        <WeightField label="Weight out" value={weightOut} onChange={setWeightOut} />
        <Button variant="primary" disabled={freeNeuron < 0} onClick={() => onAdd(parseSource(source), parseSink(sink), weightIn, weightOut)}>
          Add
        </Button>
      </div>
    </section>
  );
}

function PasteGenome({ onReplace }: { onReplace: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <section className="flex flex-col gap-2 border border-grey-mid p-3">
      <h3 className="font-bold">Replace the genes</h3>
      <p className="text-xs">
        Paste a genome copied from the app or from this page: genes in hexadecimal, a JSON list of numbers, or a
        JSON entry with <code>genome</code>. It is read with the sensors and actions of this file.
      </p>
      <textarea
        aria-label="Genome to paste"
        className="min-h-16 bg-grey-mid p-1 font-mono text-xs"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div>
        <Button variant="grey" disabled={text.trim() === ""} onClick={() => onReplace(text)}>Replace genes</Button>
      </div>
    </section>
  );
}
