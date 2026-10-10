"use client";

import React, { useState } from "react";
import { worldControllerAtom } from "../../store";
import { atom, useAtom, useAtomValue } from "jotai";
import Button from "@/components/global/Button";
import NumberInput from "@/components/global/inputs/NumberInput";
import { saveAs } from "file-saver";
import useWorldValue from "@/hooks/useWorldValue";

// kept outside the component so the value survives switching tabs
const logCreatureIdAtom = atom(0);

function describeLoggedCreatures(creatureId: number): string {
  switch (creatureId) {
    case 0:
      return "all creatures";
    case -10:
      return "creatures 0 to 9";
    case -30:
      return "creatures 0 to 29";
    default:
      return `creature id ${creatureId}`;
  }
}

export default function LoggerStatus() {
  const worldController = useAtomValue(worldControllerAtom);
  const logEnabled = useWorldValue((world) => Boolean(world.simData.constants.LOG_ENABLED), false);
  const logCount = useWorldValue((world) => world.eventLogger.logCount, 0);
  const loggedCreatureId = useWorldValue((world) => world.eventLogger.creatureId, 0);
  const eventLoggerIsPaused = useWorldValue((world) => world.eventLoggerIsPaused, false);
  const [logCreatureId, setLogCreatureId] = useAtom(logCreatureIdAtom);
  const [creatureMessage, setCreatureMessage] = useState("");

  // runs a logger action and lets the UI know, since it can happen while the simulation is paused
  const runLoggerAction = (action: () => void) => {
    if (!worldController) return;
    action();
    worldController.notifyStateChange();
  };

  const handleTogglePause = () => {
    if (!worldController) return;
    if (eventLoggerIsPaused) {
      worldController.resumeLog();
    } else {
      worldController.pauseLog();
    }
  };

  const handleSaveLog = () => {
    if (!worldController) return;
    const saveLog: Blob = worldController.eventLogger.getLogBlob();
    saveAs(saveLog, `simlog ${worldController.currentGen}.csv`);
  };

  const handleLogCreature = () => {
    runLoggerAction(() => {
      setCreatureMessage("");
      try {
        worldController!.eventLogger.startLoggingCreatureId(logCreatureId);
      } catch (error) {
        // the logger is already set to the new id; only the first record of the creature failed
        setCreatureMessage(
          `Creature ${logCreatureId} is not alive in this generation, it will be logged if it appears.`
        );
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4">
        <dt>Log</dt>
        <dd>{logEnabled ? `enabled for ${describeLoggedCreatures(loggedCreatureId)}` : "off"}</dd>
        {logEnabled && (
          <>
            <dt>Status</dt>
            <dd>{eventLoggerIsPaused ? "Paused" : "Recording"}</dd>
            <dt>Events logged</dt>
            <dd>{logCount}</dd>
          </>
        )}
      </dl>

      {logEnabled && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleTogglePause}>
              {eventLoggerIsPaused ? "Resume log" : "Pause log"}
            </Button>
            <Button onClick={() => runLoggerAction(() => worldController!.eventLogger.recordFirstGeneration())}>
              Record first generation and pause
            </Button>
            <Button onClick={() => runLoggerAction(() => worldController!.eventLogger.recordFromFirstGeneration())}>
              Record from first generation
            </Button>
            <Button onClick={() => runLoggerAction(() => worldController!.eventLogger.recordNextGeneration())}>
              Record next generation
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveLog}>Save log</Button>
            <Button variant="danger" onClick={() => runLoggerAction(() => worldController!.eventLogger.deleteLog())}>
              Delete log
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-40">
                <NumberInput
                  label="Creature to log"
                  value={logCreatureId}
                  onChange={setLogCreatureId}
                  integer
                />
              </div>
              <Button onClick={handleLogCreature}>Log this creature</Button>
            </div>
            <p className="text-xs">0 logs all creatures, -10 creatures 0 to 9, -30 creatures 0 to 29.</p>
            {creatureMessage && <p role="status" className="text-sm">{creatureMessage}</p>}
          </div>
        </>
      )}
    </div>
  );
}
