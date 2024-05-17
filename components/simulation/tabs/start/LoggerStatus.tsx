"use client";

import React, { useEffect } from "react";
import {worldControllerAtom} from "../../store";
import {atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import {LOG_CREATURE_ID, LOG_ENABLED} from "@/simulation/simulationConstants"
import Button from "@/components/global/Button";
import { saveAs } from "file-saver";
import useEventLoggerPropertyValue from "@/hooks/useEventLoggerPropertyValue";
import useWorldProperty from "@/hooks/useWorldProperty";
import { error } from "console";
import Creature from "@/simulation/creature/Creature";



const logCreatureIdAtom = atom(0);

//TODO refresh log count
export default function LoggerStatus() {
  const worldController = useAtomValue(worldControllerAtom);
  const logCount = useEventLoggerPropertyValue((eventLogger) => eventLogger.logCount, 0);
  const [logCreatureId, setLogCreatureId] = useAtom(logCreatureIdAtom)

  const [eventLoggerIsPaused, setEventLoggerIsPaused] = useWorldProperty(
    (world) => world.eventLoggerIsPaused,
    (world) => {
      if (world.eventLoggerIsPaused) {
        world.resumeLog();
      } else {
        world.pauseLog();
      }
    },
    false
  );

  const handleClick = () => {
    setEventLoggerIsPaused(!eventLoggerIsPaused);
  };

  function logStatus(): string {
    if (!LOG_ENABLED) {
      return "off"
    }
    switch (LOG_CREATURE_ID) {
      case 0:
        return "enabled for all creatures";
      case -10:
        return "enabled for creatures 0 to 9";
      case -30:
        return "enabled for creatures 0 to 29";
      default:
        return "enabled for creature id ".concat(LOG_CREATURE_ID.toString());
    }
  }

  function handleSaveLog(): void {
    if (worldController) {
      const saveLog : Blob = worldController?.eventLogger.getLogBlob();
      saveAs( saveLog, 'simlog '.concat(worldController.currentGen.toString()).concat(".csv") ); 
    }
    else {
      console.error("worldController not found");
    }
  }
  /*
  function handleToggleLog() {
    if (worldController) {
        worldController.eventLogger.togglePause();
    }
  }
  */
  function handleDeleteLog() {
    if (worldController) {
        worldController.eventLogger.deleteLog();
    }
  }
  function handleRecordNextGenerationLog() {
    if (worldController) {
        worldController.eventLogger.recordNextGeneration();
    }
  }
  function handleRecordFirstGenerationLog() {
    if (worldController) {
        worldController.eventLogger.recordFirstGeneration();
    }
  }
  function handleLogCreatureId(e : any) {
    if (worldController) {
      const creatureId = parseInt(e.target.value);
      console.log("selected creatureId = ", creatureId);
      if (creatureId != Number.NaN) {
        worldController!.eventLogger.startLoggingCreatureId(creatureId); 
        setLogCreatureId( (prevState) => creatureId);
      }
     } else {
      throw new Error("worldController not found");
    }
  }

  return (
    <div>
      <p className="mb-2 text-lg">Log is: {logStatus()}</p>
      <p className="mb-2 text-lg">{(!LOG_ENABLED || !worldController )  ? "" : "Log count: ".concat(logCount.toString()) }</p>
      <div>
        {
        LOG_ENABLED ? (
            <div>
              Log status: {eventLoggerIsPaused ? "Paused" : "Active"}
              <div className="my-3"><Button onClick={handleClick}>{eventLoggerIsPaused ? "Resume log" : "Pause log"}</Button></div>
              <div className="my-3"><Button onClick={handleRecordFirstGenerationLog}>Record first generation</Button></div>
              <div className="my-3"><Button onClick={handleRecordNextGenerationLog}>Record next generation</Button></div>
              <div className="my-3"><Button onClick={handleSaveLog}>Save log</Button></div>
              <div className="my-3"><Button onClick={handleDeleteLog}>Delete log</Button></div>
            </div>
        ) : (<p></p>)
      }
        </div>
           {/*  creature id  */}
           <div className="flex flex-col">
          <label className="grow">Creature to log </label>
          <input
              type="text"
              value={logCreatureId}
              onChange={(e) => handleLogCreatureId(e)}
              className="min-w-0 bg-grey-mid p-1"
            >
          </input>
        </div>

    </div>
  );
}
