"use client";

import { useState } from "react";
import Button from "@/components/global/Button";
import CreatureSensors, { SensorName } from "@/simulation/creature/brain/CreatureSensors";
import CreatureActions, { ActionName } from "@/simulation/creature/brain/CreatureActions";
import { GeneLists, ListsChange } from "@/simulation/serialization/genomeFile";

// every sensor and action, in table order: the order genes address them in
const ALL_SENSORS = Object.keys(new CreatureSensors().data) as SensorName[];
const ALL_ACTIONS = Object.keys(new CreatureActions(0).data) as ActionName[];
const prettyName = (name: string) => name.replace(/([A-Z])/g, " $1").trim();

interface Props {
  lists: GeneLists;
  /** the lists of the file as it was opened */
  fileLists: GeneLists;
  /** how many genomes use each sensor and action, by name */
  usage: Map<string, number>;
  /** what applying the draft would do to the genomes */
  preview: (draft: GeneLists) => Omit<ListsChange, "data">;
  onApply: (draft: GeneLists) => void;
  canUndo: boolean;
  onUndo: () => void;
}

const sameLists = (a: GeneLists, b: GeneLists) =>
  a.maxNumberNeurons === b.maxNumberNeurons
  && a.enabledSensors.length === b.enabledSensors.length && a.enabledSensors.every((name) => b.enabledSensors.includes(name))
  && a.enabledActions.length === b.enabledActions.length && a.enabledActions.every((name) => b.enabledActions.includes(name));

// The sensors, actions and Max neurons of the file. Changes are a draft until Apply, which rewrites
// every genome so that its brain stays the same, except for the genes of what is disabled
export default function GeneListsEditor(props: Props) {
  // a new draft each time the applied lists change
  const key = JSON.stringify(props.lists);
  return <ListsForm key={key} {...props} />;
}

function ListsForm({ lists, fileLists, usage, preview, onApply, canUndo, onUndo }: Props) {
  const [draft, setDraft] = useState<GeneLists>(lists);
  const [neuronsText, setNeuronsText] = useState(String(lists.maxNumberNeurons));
  const changed = !sameLists(draft, lists);
  const valid = draft.enabledSensors.length > 0 && draft.enabledActions.length > 0
    && Number.isInteger(draft.maxNumberNeurons) && draft.maxNumberNeurons >= 1 && draft.maxNumberNeurons <= 128;
  const effect = changed && valid ? preview(draft) : null;
  const differsFromFile = !sameLists(lists, fileLists);

  const toggle = <K extends "enabledSensors" | "enabledActions">(list: K, name: GeneLists[K][number], checked: boolean) =>
    setDraft((prev) => ({
      ...prev,
      [list]: checked ? [...prev[list], name] : (prev[list] as string[]).filter((item) => item !== name),
    }));

  const checkboxes = <K extends "enabledSensors" | "enabledActions">(list: K, names: GeneLists[K][number][]) => (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-x-4 gap-y-1">
      {names.map((name) => {
        const checked = (draft[list] as string[]).includes(name);
        const wasEnabled = (lists[list] as string[]).includes(name);
        const used = usage.get(name) ?? 0;
        return (
          <li key={name}>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={checked} onChange={(e) => toggle(list, name, e.target.checked)} />
              <span className={checked !== wasEnabled ? "font-bold" : undefined}>{prettyName(name)}</span>
              {wasEnabled && used > 0 && (
                <span className="text-xs tabular-nums" title="Genomes with a gene that uses it">
                  {used} genome{used === 1 ? "" : "s"}
                </span>
              )}
            </label>
          </li>
        );
      })}
    </ul>
  );

  return (
    <details className="border border-grey-mid p-3" open={differsFromFile || undefined}>
      <summary className="cursor-pointer text-lg font-bold">Sensors, actions and Max neurons</summary>
      <div className="mt-2 flex flex-col gap-3 text-sm">
        <p>
          What the brains of this file can use. Applying a change rewrites every genome, as <i>Update simulation</i>{" "}
          does in the app, so each brain stays the same: genes of a sensor or action you disable are deleted, and a
          neuron not below the new Max neurons connects to another neuron. Species keep their ids. Changes in bold are
          not applied yet. With metabolism, a newly enabled sensor or action costs nothing until you give it a cost
          in the app (Scenario → sensors and actions).
        </p>

        <fieldset className="flex flex-col gap-1">
          <legend className="font-bold">Sensors</legend>
          {checkboxes("enabledSensors", ALL_SENSORS)}
        </fieldset>
        <fieldset className="flex flex-col gap-1">
          <legend className="font-bold">Actions</legend>
          {checkboxes("enabledActions", ALL_ACTIONS)}
        </fieldset>
        <label className="flex items-center gap-2">
          Max neurons
          <input
            type="number"
            className="w-20 bg-grey-mid p-1"
            min={1}
            max={128}
            step={1}
            value={neuronsText}
            onChange={(e) => {
              setNeuronsText(e.target.value);
              setDraft((prev) => ({ ...prev, maxNumberNeurons: Number(e.target.value) }));
            }}
          />
          <span className={draft.maxNumberNeurons !== lists.maxNumberNeurons ? "font-bold" : undefined}>
            (applied: {lists.maxNumberNeurons})
          </span>
        </label>

        {!valid && (
          <p role="alert" className="bg-red p-2">
            At least one sensor and one action must stay enabled, and Max neurons must be a whole number from 1 to 128.
          </p>
        )}
        {effect && (
          <p className={effect.changedGenomes > 0 ? "bg-red p-2" : undefined}>
            {effect.changedGenomes === 0
              ? "Applying keeps every brain: the genes are rewritten for the new lists."
              : `Applying changes the brain of ${effect.changedGenomes} genome${effect.changedGenomes === 1 ? "" : "s"}: ` +
                `${effect.removed} gene${effect.removed === 1 ? " is" : "s are"} deleted` +
                (effect.folded > 0 ? ` and ${effect.folded} connect${effect.folded === 1 ? "s" : ""} to another neuron` : "") +
                ". The other brains are kept."}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" disabled={!changed || !valid} onClick={() => onApply(draft)}>Apply</Button>
          <Button
            variant="grey"
            disabled={!changed}
            onClick={() => {
              setDraft(lists);
              setNeuronsText(String(lists.maxNumberNeurons));
            }}
          >
            Discard changes
          </Button>
          <Button variant="grey" disabled={!canUndo} onClick={onUndo} title="Back to the lists and genomes before the last Apply">
            Undo last apply
          </Button>
        </div>
      </div>
    </details>
  );
}
