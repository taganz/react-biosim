"use client";

import { useState } from "react";
import { useAtomValue } from "jotai";
import { saveAs } from "file-saver";
import Button from "@/components/global/Button";
import CheckboxInput from "@/components/global/inputs/CheckboxInput";
import NumberInput from "@/components/global/inputs/NumberInput";
import SelectInput from "@/components/global/inputs/SelectInput";
import useWorldValue from "@/hooks/useWorldValue";
import { LogFile, LogScope, LogState, LOG_OPTIONS_DEFAULT } from "@/simulation/log/SimulationLog";
import { checkWaterSettings } from "@/simulation/water/checkWaterSettings";
import { simulationDataAtom, worldControllerAtom } from "../../store";
import CollapsibleSection from "../CollapsibleSection";
import { FIELDS_GRID } from "../Section";
import useSetLogOptions from "./useSetLogOptions";

const LOCALES: [string, string][] = [
  ["es-ES", "es-ES (1234,5)"],
  ["en-US", "en-US (1234.5)"],
];

// each file is a separate download
function saveFiles(files: LogFile[]) {
  for (const file of files) {
    saveAs(new Blob(file.lines, { type: "text/csv;charset=utf-8" }), file.name);
  }
}

// The log of species and creatures: tables with one row per species or creature, saved as CSV
export default function LogSection() {
  const worldController = useAtomValue(worldControllerAtom);
  const simulationData = useAtomValue(simulationDataAtom);
  const setLogOptions = useSetLogOptions();
  const [fromStart, setFromStart] = useState(false);
  const [message, setMessage] = useState("");

  const state = useWorldValue((world) => world.simulationLog.state, LogState.IDLE);
  const waitingForRun = useWorldValue((world) => world.simulationLog.isWaitingForRun, false);
  const rowCount = useWorldValue((world) => world.simulationLog.rowCount, 0);
  const maxRows = useWorldValue((world) => world.simulationLog.maxRows, 0);
  const hasUnsavedRows = useWorldValue((world) => world.simulationLog.hasUnsavedRows, false);
  const firstGen = useWorldValue((world) => world.simulationLog.firstGeneration, 0);
  const lastGen = useWorldValue((world) => world.simulationLog.lastGeneration, 0);
  const scope = useWorldValue<LogScope>((world) => world.simulationLog.scope, "all");
  // the marks are sets: the version tells when to read them again
  useWorldValue((world) => world.simulationLog.version, 0);
  const constants = useWorldValue((world) => world.simData.constants, simulationData.constants);
  const options = { ...LOG_OPTIONS_DEFAULT, ...constants };

  const log = worldController?.simulationLog;
  const markedSpecies = log ? Array.from(log.markedSpecies) : [];
  const markedCreatures = log ? Array.from(log.markedCreatures) : [];
  const isRecording = state === LogState.RECORDING;
  const nothingToWrite = !options.LOG_SPECIES && !options.LOG_CREATURES;
  const nothingMarked = scope === "marked" && markedSpecies.length === 0 && markedCreatures.length === 0;

  // runs a log action and lets the UI know, since it can happen while the simulation is paused
  const run = (action: () => void) => {
    if (!worldController) return;
    setMessage("");
    action();
    worldController.notifyStateChange();
  };

  // starting a recording or deleting drops the rows: ask first if they have not been saved
  const confirmDiscard = () =>
    !hasUnsavedRows || window.confirm(`The recording has ${rowCount} rows that are not saved. Delete them?`);

  const handleSnapshot = () => run(() => {
    const files = worldController!.simulationLog.snapshot();
    saveFiles(files);
    setMessage(`Saved ${files.map((file) => file.name).join(", ")}.`);
  });

  const handleStart = () => {
    if (!worldController || !confirmDiscard()) return;
    if (!fromStart) {
      run(() => worldController.simulationLog.startRecording());
      return;
    }
    const waterError = checkWaterSettings(simulationData).errors[0];
    if (waterError) {
      setMessage(`Cannot restart: ${waterError}`);
      return;
    }
    run(() => {
      // like the Restart button, with a recording that starts at its step 1
      worldController.simulationLog.startRecordingWithNextRun();
      worldController.startRun(simulationData, worldController.restartSimCode(simulationData));
    });
  };

  const handleSave = () => run(() => {
    const files = worldController!.simulationLog.recordedFiles();
    saveFiles(files);
    worldController!.simulationLog.markSaved();
    setMessage(`Saved ${files.map((file) => file.name).join(", ")}.`);
  });

  const describeState = (): string => {
    switch (state) {
      case LogState.IDLE:
        return rowCount > 0 ? "Stopped" : "Not recording";
      case LogState.RECORDING:
        return waitingForRun ? "Recording: waiting for the first step" : "Recording";
      case LogState.FULL:
        return "Stopped: the recording reached Maximum rows";
      case LogState.RUN_REPLACED:
        return "Stopped: the simulation was restarted or loaded";
    }
  };

  return (
    <CollapsibleSection
      title="Log"
      storageKey="simulation.log"
      description="Tables of species and creatures, one row each, saved as CSV files with a file of settings."
    >
      <div className="flex flex-col gap-4">
        <div className={FIELDS_GRID}>
          <div className="flex flex-col gap-1">
            <span className="text-sm">Files</span>
            <CheckboxInput
              id="log-species"
              label="Species"
              checked={options.LOG_SPECIES}
              onChange={(checked) => setLogOptions({ LOG_SPECIES: checked })}
            />
            <CheckboxInput
              id="log-creatures"
              label="Creatures"
              checked={options.LOG_CREATURES}
              onChange={(checked) => setLogOptions({ LOG_CREATURES: checked })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <SelectInput
              label="Which ones"
              value={scope}
              onChange={(value: string) => run(() => worldController!.simulationLog.setScope(value as LogScope))}
            >
              <option value="all">All</option>
              <option value="marked">Marked in Population</option>
            </SelectInput>
            <p className="text-xs">
              Mark species and creatures with <b>Mark for log</b> in the Population tab. With marked species,
              the file of creatures has their creatures too.
            </p>
          </div>
        </div>

        {scope === "marked" && (
          <div className="flex flex-col gap-1 text-sm">
            {nothingMarked ? (
              <p role="status">Nothing is marked: the files would be empty.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {markedSpecies.map((id) => (
                  <MarkedItem key={`s-${id}`} label={`Species ${id}`}
                    onRemove={() => run(() => log!.setSpeciesMarked(id, false))} />
                ))}
                {markedCreatures.map((key) => (
                  <MarkedItem key={`c-${key}`} label={`Creature ${key}`}
                    onRemove={() => run(() => log!.setCreatureKeyMarked(key, false))} />
                ))}
              </ul>
            )}
            {!nothingMarked && (
              <div>
                <Button onClick={() => run(() => log!.clearMarks())}>Clear marks</Button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSnapshot} disabled={nothingToWrite}>Save snapshot</Button>
          </div>
          <p className="text-xs">
            A snapshot saves the species and creatures alive now (and the ones that died in this generation)
            at once. A recording adds their rows at the end of every generation, and every
            <i> Also every</i> steps if set, until it is stopped.
          </p>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
          <dt>Recording</dt>
          <dd role="status">{describeState()}</dd>
          <dt>Rows</dt>
          <dd>{`${rowCount} of ${maxRows}${hasUnsavedRows ? " (not saved)" : ""}`}</dd>
          {lastGen > 0 && (
            <>
              <dt>Generations</dt>
              <dd>{firstGen === lastGen ? firstGen : `${firstGen} to ${lastGen}`}</dd>
            </>
          )}
        </dl>

        <div className="flex flex-wrap items-end gap-2">
          {!isRecording && (
            <SelectInput
              label="From"
              value={fromStart ? "start" : "now"}
              onChange={(value: string) => setFromStart(value === "start")}
            >
              <option value="now">Now</option>
              <option value="start">Generation 1 (restarts the simulation)</option>
            </SelectInput>
          )}
          {isRecording ? (
            <Button onClick={() => run(() => log!.stopRecording())}>Stop recording</Button>
          ) : (
            <Button onClick={handleStart} disabled={nothingToWrite}>Start recording</Button>
          )}
          {state === LogState.RUN_REPLACED && (
            <Button
              onClick={() => run(() => log!.resumeRecording())}
              title="Add the rows of the new run to this recording; its generations start again at 1"
            >
              Continue recording
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={rowCount === 0}>Save recording</Button>
          <Button
            variant="danger"
            disabled={rowCount === 0 && !isRecording}
            onClick={() => confirmDiscard() && run(() => log!.clear())}
          >
            Delete recording
          </Button>
        </div>
        <p className="text-xs">
          To draw the tree of species, record the species from generation 1 with <b>All</b>: every species
          seen in a generation gets a row at its end, also the ones that died out, with the species it came from.
          A recording keeps the options it started with.
        </p>
        {message && <p role="status" className="text-sm">{message}</p>}

        <CollapsibleSection title="Options" storageKey="simulation.log.options">
          <div className={FIELDS_GRID}>
            <div className="flex flex-col gap-1">
              <NumberInput
                label="Also every (steps)"
                value={options.LOG_EVERY_N_STEPS}
                onChange={(value) => setLogOptions({ LOG_EVERY_N_STEPS: value })}
                integer
                min={0}
              />
              <p className="text-xs">0: only at the end of each generation.</p>
            </div>
            <div className="flex flex-col gap-1">
              <CheckboxInput
                id="log-include-dead"
                label="Creatures: also the dead"
                checked={options.LOG_INCLUDE_DEAD}
                onChange={(checked) => setLogOptions({ LOG_INCLUDE_DEAD: checked })}
              />
              <CheckboxInput
                id="log-creature-genome"
                label="Creatures: genome"
                checked={options.LOG_CREATURE_GENOME}
                onChange={(checked) => setLogOptions({ LOG_CREATURE_GENOME: checked })}
              />
              <CheckboxInput
                id="log-species-creature-list"
                label="Species: list of living creatures"
                checked={options.LOG_SPECIES_CREATURE_LIST}
                onChange={(checked) => setLogOptions({ LOG_SPECIES_CREATURE_LIST: checked })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <SelectInput
                label="Number format"
                value={options.LOG_LOCALE_STRING}
                onChange={(value: string) => setLogOptions({ LOG_LOCALE_STRING: value })}
              >
                {!LOCALES.some(([locale]) => locale === options.LOG_LOCALE_STRING) && (
                  <option value={options.LOG_LOCALE_STRING}>{options.LOG_LOCALE_STRING}</option>
                )}
                {LOCALES.map(([locale, label]) => (
                  <option key={locale} value={locale}>{label}</option>
                ))}
              </SelectInput>
              <NumberInput
                label="Maximum rows"
                value={options.LOG_MAX_ROWS}
                onChange={(value) => setLogOptions({ LOG_MAX_ROWS: value })}
                integer
                min={1}
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </CollapsibleSection>
  );
}

function MarkedItem({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-1 border border-grey-mid px-2 py-1 font-mono text-xs">
      {label}
      <button className="px-1 hover:bg-grey-mid" aria-label={`Unmark ${label}`} title={`Unmark ${label}`} onClick={onRemove}>
        ×
      </button>
    </li>
  );
}
