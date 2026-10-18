"use client";

import { useState } from "react";
import { logFromFirstGenerationAtom, logOneGenerationAtom, worldControllerAtom } from "../../store";
import { useAtom, useAtomValue } from "jotai";
import Button from "@/components/global/Button";
import NumberInput from "@/components/global/inputs/NumberInput";
import SelectInput from "@/components/global/inputs/SelectInput";
import { saveAs } from "file-saver";
import useWorldValue from "@/hooks/useWorldValue";
import { LOG_NO_CREATURES, LoggerState } from "@/simulation/logger/EventLogger";
import useSetLogOptions from "./useSetLogOptions";

// the ranges Creature to log accepts; any other value is a single creature
const CREATURE_RANGES: [number, string][] = [
  [LOG_NO_CREATURES, "No creatures (only totals)"],
  [0, "All creatures"],
  [-10, "Creatures 1 to 9"],
  [-30, "Creatures 1 to 29"],
];
const ONE_CREATURE = "one";

function describeLoggedCreatures(creatureId: number): string {
  const range = CREATURE_RANGES.find(([id]) => id === creatureId);
  return range ? range[1].toLowerCase() : `creature ${creatureId}`;
}

export default function LoggerStatus() {
  const worldController = useAtomValue(worldControllerAtom);
  const setLogOptions = useSetLogOptions();
  const [fromFirstGeneration, setFromFirstGeneration] = useAtom(logFromFirstGenerationAtom);
  const [oneGeneration, setOneGeneration] = useAtom(logOneGenerationAtom);
  const state = useWorldValue((world) => world.eventLogger.state, LoggerState.OFF);
  const logCount = useWorldValue((world) => world.eventLogger.logCount, 0);
  const maxEvents = useWorldValue((world) => world.eventLogger.maxEvents, 0);
  const hasUnsavedRows = useWorldValue((world) => world.eventLogger.hasUnsavedRows, false);
  const firstGenLogged = useWorldValue((world) => world.eventLogger.firstGenerationLogged, 0);
  const lastGenLogged = useWorldValue((world) => world.eventLogger.lastGenerationLogged, 0);
  const firstGenToWaitFor = useWorldValue((world) => world.eventLogger.firstGenerationToWaitFor, 0);
  const stopsAtEndOfGeneration = useWorldValue((world) => world.eventLogger.stopsAtEndOfGeneration, false);
  const currentGen = useWorldValue((world) => world.currentGen, 0);
  const currentStep = useWorldValue((world) => world.currentStep, 0);
  // the creature the recording uses, read from Creature to log when it started
  const loggedCreatureId = useWorldValue((world) => world.eventLogger.creatureId, 0);
  const logCreatureId = useWorldValue((world) => Number(world.simData.constants.LOG_CREATURE_ID ?? 0), 0);
  const creatureDeathGen = useWorldValue((world) => world.eventLogger.creatureDeathGen, 0);
  const creatureDeathStep = useWorldValue((world) => world.eventLogger.creatureDeathStep, 0);
  // most selection methods restart the ids every generation, so a new creature can take the id
  const loggedCreatureIsAlive = useWorldValue(
    (world) => world.generations.currentCreatures.some((creature) => creature.id === loggedCreatureId),
    false
  );
  const idsRestartEveryGeneration = useWorldValue(
    (world) => !world.generations.isContinuous
      && world.generations.selectionMethod.shouldResetLastCreatureIdCreatedEveryGeneration,
    false
  );
  const [message, setMessage] = useState("");

  const isRunning = state === LoggerState.RECORDING || state === LoggerState.WAITING;
  const isSingleCreature = !CREATURE_RANGES.some(([id]) => id === logCreatureId);

  const describeState = (): string => {
    switch (state) {
      case LoggerState.OFF:
        return "Off";
      case LoggerState.PAUSED:
        return "Stopped";
      case LoggerState.WAITING:
        if (firstGenToWaitFor === 1) {
          return currentGen === 1 && currentStep === 1
            ? "Waiting for generation 1 to start"
            : "Waiting for generation 1: press Restart to start it";
        }
        return `Waiting for generation ${currentStep === 1 ? currentGen : currentGen + 1} to start`;
      case LoggerState.RECORDING:
        return `Recording generation ${currentGen}${stopsAtEndOfGeneration ? ", stops at its end" : ""}`;
      case LoggerState.MAX_REACHED:
        return "Stopped: the log reached Maximum events";
      case LoggerState.FINISHED:
        return "Stopped: the generation is recorded";
    }
  };

  // runs a logger action and lets the UI know, since it can happen while the simulation is paused
  const runLoggerAction = (action: () => void) => {
    if (!worldController) return;
    setMessage("");
    action();
    worldController.notifyStateChange();
  };

  // starting a recording or deleting drops the log: ask first if it has not been saved
  const runDiscardingAction = (action: () => void) => {
    if (!hasUnsavedRows || window.confirm(`The log has ${logCount} events that are not saved. Delete them?`)) {
      runLoggerAction(action);
    }
  };

  const handleStart = () =>
    runDiscardingAction(() => worldController!.eventLogger.startRecording(fromFirstGeneration, oneGeneration));

  const handleSaveLog = () => {
    runLoggerAction(() => {
      const saveLog: Blob = worldController!.eventLogger.getLogBlob();
      saveAs(saveLog, `sim ${worldController!.simCode} generation ${worldController!.currentGen}_creature ${loggedCreatureId}.csv`);
      worldController!.eventLogger.markSaved();
    });
  };

  const handleCreatureRange = (value: string) => {
    // a single creature keeps the id it had, or starts at 1
    if (value === ONE_CREATURE) {
      setLogOptions({ LOG_CREATURE_ID: isSingleCreature ? logCreatureId : 1 });
    } else {
      setLogOptions({ LOG_CREATURE_ID: Number(value) });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4">
        <dt>Status</dt>
        <dd>{describeState()}</dd>
        <dt>Events logged</dt>
        <dd>{`${logCount} of ${maxEvents}${hasUnsavedRows ? " (not saved)" : ""}`}</dd>
        {lastGenLogged > 0 && (
          <>
            <dt>Generations</dt>
            <dd>{firstGenLogged === lastGenLogged ? firstGenLogged : `${firstGenLogged} to ${lastGenLogged}`}</dd>
            <dt>Creatures</dt>
            <dd>{describeLoggedCreatures(loggedCreatureId)}</dd>
          </>
        )}
      </dl>

      <div className="flex flex-wrap items-end gap-2">
        <SelectInput
          label="From"
          value={fromFirstGeneration ? "first" : "next"}
          onChange={(value) => setFromFirstGeneration(value === "first")}
        >
          <option value="next">Next generation</option>
          <option value="first">Generation 1 (needs Restart)</option>
        </SelectInput>
        <SelectInput
          label="For"
          value={oneGeneration ? "one" : "all"}
          onChange={(value) => setOneGeneration(value === "one")}
        >
          <option value="one">One generation</option>
          <option value="all">Until stopped</option>
        </SelectInput>
        {isRunning ? (
          <Button onClick={() => runLoggerAction(() => worldController!.pauseLog())}>Stop log</Button>
        ) : (
          <Button onClick={handleStart}>Start recording</Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSaveLog} disabled={logCount === 0}>Save log</Button>
        <Button
          variant="danger"
          disabled={logCount === 0}
          onClick={() => runDiscardingAction(() => worldController!.eventLogger.deleteLog())}
        >
          Delete log
        </Button>
      </div>
      {message && <p role="status" className="text-sm">{message}</p>}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-end gap-2">
          <SelectInput
            label="Creature to log"
            value={isSingleCreature ? ONE_CREATURE : String(logCreatureId)}
            onChange={handleCreatureRange}
          >
            {CREATURE_RANGES.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
            <option value={ONE_CREATURE}>One creature</option>
          </SelectInput>
          {isSingleCreature && (
            <div className="w-32">
              <NumberInput
                label="Creature id"
                value={logCreatureId}
                onChange={(value) => setLogOptions({ LOG_CREATURE_ID: value })}
                min={1}
                integer
              />
            </div>
          )}
        </div>
        <p className="text-xs">
          Whose events are written, one row each. The totals count these creatures, or all of them with No
          creatures. It is read when a recording starts. Set as creature to log, in the Population tab, sets it to the
          selected creature.
        </p>
        {isRunning && logCreatureId !== loggedCreatureId && (
          <p role="status" className="text-sm">
            This recording logs {describeLoggedCreatures(loggedCreatureId)}. Creature to log is used from the next
            recording.
          </p>
        )}
        {isSingleCreature && idsRestartEveryGeneration && (
          <p role="status" className="text-sm">
            This selection method gives the ids again every generation: in each generation, id {logCreatureId} is
            a different creature.
          </p>
        )}
        {loggedCreatureId > 0 && creatureDeathGen > 0 && !loggedCreatureIsAlive && (
          <p role="status" className="text-sm text-red">
            Creature {loggedCreatureId} died at generation {creatureDeathGen}, step {creatureDeathStep}: no more
            events of it are logged.
          </p>
        )}
      </div>
    </div>
  );
}
