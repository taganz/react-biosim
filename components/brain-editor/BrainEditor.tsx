"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import classNames from "classnames";
import { saveAs } from "file-saver";
import { FaCheck, FaClipboard, FaCode } from "react-icons/fa";
import Button from "@/components/global/Button";
import Genome, { Gene } from "@/simulation/creature/brain/Genome";
import { describeGenome, editorContext, EditorContext } from "@/simulation/creature/brain/genomeEditing";
import { sameGenes } from "@/simulation/creature/speciesId";
import { SavedSimulationData } from "@/simulation/serialization/data/SavedSimulationData";
import {
  GenomeEntry, applyGenomeEdits, editedFileName, listGenomes, parseSimFile, stringifySimFile,
} from "@/simulation/serialization/genomeFile";
import type { Genus } from "@/simulation/creature/CreatureGenus";
import { GENUS_LABELS } from "@/components/simulation/tabs/population/genusLabels";
import GenomeEditor from "./GenomeEditor";
import useCopy from "./useCopy";

type Loaded = {
  name: string;
  data: SavedSimulationData;
  entries: GenomeEntry[];
  context: EditorContext;
};

// the earlier genes of a genome, to undo
type UndoStep = Gene[];

const SOURCE_TITLES: Record<GenomeEntry["source"], string> = {
  species: "Species in the world",
  startGenome: "Genomes that start the generation",
  defaultSpecies: "Species of generation 1 (POPULATION_DEFAULT_SPECIES)",
  plantGenes: "Plant genes",
};

// Opens a .sim file, shows the brain of each of its genomes, edits them and saves the file again
export default function BrainEditor() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<Record<string, Gene[]>>({});
  const [undo, setUndo] = useState<Record<string, UndoStep[]>>({});
  // the tag of the last change of each genome: changes with the same tag (dragging a weight) are undone together
  const lastTag = useRef<Record<string, string | undefined>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  const genesOf = (entry: GenomeEntry) => current[entry.key] ?? entry.genes;
  const editedEntries = loaded?.entries.filter((entry) => !sameGenes(genesOf(entry), entry.genes)) ?? [];

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (editedEntries.length > 0 && !window.confirm("The changes to the open file are not saved. Open the new file anyway?")) return;
    try {
      const data = parseSimFile(await file.text());
      const entries = listGenomes(data);
      setLoaded({ name: file.name, data, entries, context: editorContext(data.worldGenerationsData) });
      setCurrent({});
      setUndo({});
      lastTag.current = {};
      setSelectedKey(entries[0]?.key ?? null);
      setFileName(editedFileName(file.name));
      setError(null);
      setSaveMessage(null);
    } catch (err) {
      setError(`Could not open "${file.name}": ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const changeGenes = (key: string, genes: Gene[], tag?: string) => {
    const entry = loaded!.entries.find((e) => e.key === key)!;
    const previous = genesOf(entry);
    if (sameGenes(previous, genes)) return;
    const joinsLast = tag !== undefined && lastTag.current[key] === tag;
    lastTag.current[key] = tag;
    if (!joinsLast) setUndo((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), previous] }));
    setCurrent((prev) => ({ ...prev, [key]: genes }));
    setSaveMessage(null);
  };

  const undoChange = (key: string) => {
    const steps = undo[key] ?? [];
    if (steps.length === 0) return;
    lastTag.current[key] = undefined;
    setCurrent((prev) => ({ ...prev, [key]: steps[steps.length - 1] }));
    setUndo((prev) => ({ ...prev, [key]: steps.slice(0, -1) }));
  };

  const revert = (entry: GenomeEntry) => changeGenes(entry.key, entry.genes);

  const save = () => {
    if (!loaded) return;
    try {
      const edits = new Map(editedEntries.map((entry) => [entry.key, genesOf(entry)]));
      const json = stringifySimFile(applyGenomeEdits(loaded.data, edits));
      const name = fileName.trim() === "" ? editedFileName(loaded.name) : fileName.trim().replace(/(\.sim)?$/i, ".sim");
      saveAs(new Blob([json], { type: "application/json;charset=utf-8" }), name);
      setSaveMessage(`Saved "${name}" with ${edits.size} edited genome${edits.size === 1 ? "" : "s"}.`);
    } catch (err) {
      setSaveMessage(`Could not save: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // the name a genome gets in POPULATION_DEFAULT_SPECIES, as the Scenario tab names them
  const baseName = loaded?.name.replace(/\.(sim|json|txt)$/i, "") ?? "";
  const defaultSpeciesName = (entry: GenomeEntry) =>
    entry.source === "defaultSpecies" ? entry.label : `${baseName} #${entry.index + 1}${entry.source === "species" ? "" : ` (${entry.label})`}`;
  const asJsonEntry = (entry: GenomeEntry) => JSON.stringify({ name: defaultSpeciesName(entry), genome: genesOf(entry) });

  const selected = loaded?.entries.find((entry) => entry.key === selectedKey);

  // the genus of each genome, as its brain gives it
  const genera = useMemo(() => new Map(loaded?.entries.map((entry) =>
    [entry.key, describeGenome(current[entry.key] ?? entry.genes, loaded.context).genus]) ?? []), [loaded, current]);

  return (
    <div className="section-container flex flex-col gap-6 py-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Brain editor</h1>
          <p className="text-sm">
            Open a .sim file to see the brains of its species, edit them and save the file with another name.{" "}
            <Link className="underline" href="/">Back to the simulation</Link>
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="brain-editor-file">Open .sim file</label>
          <input
            id="brain-editor-file"
            className={classNames(
              "text-sm file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-grey-mid",
              "file:px-3 file:py-1 file:text-sm file:text-white hover:file:brightness-90"
            )}
            type="file"
            accept=".sim,.txt,.json"
            onChange={handleFile}
          />
        </div>
      </header>

      {error && <p role="alert" className="bg-red p-2">{error}</p>}

      {!loaded && !error && (
        <p className="max-w-2xl">
          The file is read in the browser and is not changed: the edited copy is downloaded as a new file, which
          you can load in the simulation (Scenario → Load .sim file).
        </p>
      )}

      {loaded && (
        <>
          <FileInfo loaded={loaded} />

          <div className="grid gap-6 lg:grid-cols-[minmax(16rem,22rem)_1fr]">
            <GenomeList
              loaded={loaded}
              genesOf={genesOf}
              genera={genera}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              copied={copied}
              onCopyHex={(entry) => copy(new Genome(genesOf(entry)).toHexadecimalString(), `hex:${entry.key}`)}
              onCopyJson={(entry) => copy(asJsonEntry(entry), `json:${entry.key}`)}
              onCopyAll={() => copy(`[${loaded.entries.map(asJsonEntry).join(",\n")}]`, "all")}
            />

            <div className="min-w-0">
              {selected ? (
                <GenomeEditor
                  key={selected.key}
                  entry={selected}
                  genes={genesOf(selected)}
                  context={loaded.context}
                  data={loaded.data}
                  edited={!sameGenes(genesOf(selected), selected.genes)}
                  canUndo={(undo[selected.key] ?? []).length > 0}
                  onChange={(genes, tag) => changeGenes(selected.key, genes, tag)}
                  onUndo={() => undoChange(selected.key)}
                  onRevert={() => revert(selected)}
                  copied={copied}
                  onCopyHex={() => copy(new Genome(genesOf(selected)).toHexadecimalString(), `hex:${selected.key}`)}
                  onCopyJson={() => copy(asJsonEntry(selected), `json:${selected.key}`)}
                />
              ) : (
                <p>This file has no genomes: it is a setup, and its run starts with random genomes.</p>
              )}
            </div>
          </div>

          <section className="flex flex-col gap-2 border border-grey-mid p-3">
            <h2 className="text-lg font-bold">Save</h2>
            <p className="text-sm">
              {editedEntries.length === 0
                ? "No genome is edited yet: the file would be saved as it is, in the current format."
                : `${editedEntries.length} edited genome${editedEntries.length === 1 ? "" : "s"}: ${editedEntries.map((e) => e.label).join(", ")}.`}{" "}
              An edited species is saved as a new species that comes from the one it was.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-64 flex-1 flex-col text-sm">
                File name
                <input className="bg-grey-mid p-1" value={fileName} onChange={(e) => setFileName(e.target.value)} />
              </label>
              <Button variant="primary" onClick={save}>Save .sim file</Button>
            </div>
            {saveMessage && <p role="status" className="text-sm">{saveMessage}</p>}
          </section>
        </>
      )}
    </div>
  );
}

function FileInfo({ loaded }: { loaded: Loaded }) {
  const { data, context } = loaded;
  const generations = data.worldGenerationsData;
  const controller = data.worldControllerData;
  const totalCreatures = data.species?.reduce((sum, species) => sum + species.creatures.length, 0) ?? 0;
  return (
    <section className="flex flex-col gap-1 border border-grey-mid p-3 text-sm">
      <h2 className="text-lg font-bold">{loaded.name}</h2>
      <p>
        Simulation {controller.simCode ?? "?"} · generation {controller.currentGen ?? "?"} · {generations.simulationType} run ·{" "}
        {totalCreatures} creatures · format {data.version}
      </p>
      <p>
        {context.sensorLabels.length} enabled sensors, {context.actionLabels.length} enabled actions,{" "}
        Max neurons {context.counts.maxNeurons}, Max genome size {generations.maxGenomeSize}.{" "}
        Genes point to positions in these lists, so a brain can only use what the file enables.
      </p>
    </section>
  );
}

function GenomeList({ loaded, genesOf, genera, selectedKey, onSelect, copied, onCopyHex, onCopyJson, onCopyAll }: {
  loaded: Loaded;
  genesOf: (entry: GenomeEntry) => Gene[];
  genera: Map<string, Genus>;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  copied: string | null;
  onCopyHex: (entry: GenomeEntry) => void;
  onCopyJson: (entry: GenomeEntry) => void;
  onCopyAll: () => void;
}) {
  const sources = Array.from(new Set(loaded.entries.map((entry) => entry.source)));

  return (
    <nav className="flex flex-col gap-3" aria-label="Genomes of the file">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Genomes</h2>
        {loaded.entries.length > 0 && (
          <Button
            variant="grey"
            className="text-sm"
            icon={copied === "all" ? <FaCheck className="inline-block" /> : <FaCode className="inline-block" />}
            title="Copy every genome as a JSON list for POPULATION_DEFAULT_SPECIES (Scenario → Constants)"
            onClick={onCopyAll}
          >
            Copy all as JSON
          </Button>
        )}
      </div>
      {sources.map((source) => (
        <div key={source} className="flex flex-col gap-1">
          <h3 className="text-sm font-bold">{SOURCE_TITLES[source]}</h3>
          <ol className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
            {loaded.entries.filter((entry) => entry.source === source).map((entry) => {
              const genes = genesOf(entry);
              const edited = !sameGenes(genes, entry.genes);
              const genus = genera.get(entry.key) ?? "unknown";
              return (
                <li
                  key={entry.key}
                  className={classNames(
                    "flex items-center gap-2 border p-1",
                    entry.key === selectedKey ? "border-white bg-grey-mid" : "border-grey-mid"
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-current={entry.key === selectedKey}
                    onClick={() => onSelect(entry.key)}
                  >
                    <span className="h-4 w-4 shrink-0 rounded-sm" style={{ backgroundColor: new Genome(genes).getColor() }} aria-hidden />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">
                        {entry.label}
                        {edited && <span className="ml-2 rounded bg-blue px-1 text-xs">edited</span>}
                      </span>
                      <span className="text-xs tabular-nums">
                        {entry.creatures > 0 && `${entry.creatures} creatures · `}
                        {genes.length} genes{genus !== "unknown" && ` · ${GENUS_LABELS[genus]}`}
                      </span>
                    </span>
                  </button>
                  <Button
                    variant="dark"
                    icon={copied === `hex:${entry.key}` ? <FaCheck className="inline-block" /> : <FaClipboard className="inline-block" />}
                    aria-label={`Copy the genome of ${entry.label}`}
                    title="Copy genome (hexadecimal)"
                    onClick={() => onCopyHex(entry)}
                  />
                  <Button
                    variant="dark"
                    icon={copied === `json:${entry.key}` ? <FaCheck className="inline-block" /> : <FaCode className="inline-block" />}
                    aria-label={`Copy ${entry.label} as JSON`}
                    title="Copy as JSON, to paste in the list of POPULATION_DEFAULT_SPECIES"
                    onClick={() => onCopyJson(entry)}
                  />
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </nav>
  );
}
