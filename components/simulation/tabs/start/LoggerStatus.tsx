"use client";

import React, { useEffect } from "react";
import {worldControllerAtom, eventLoggerCountAtom} from "../../store";
import {atom, useAtom, useAtomValue } from "jotai";
import {DEBUG_CREATURE_ID} from "@/simulation/simulationConstants"
import Button from "@/components/global/Button";
import { saveAs } from "file-saver";
import useEventLoggerPropertyValue from "@/hooks/useEventLoggerPropertyValue";



//TODO refresh log count
export default function LoggerStatus() {
  const worldController = useAtomValue(worldControllerAtom);
  const logCount = useEventLoggerPropertyValue((eventLogger) => eventLogger.logCount, 0);

  function logStatus(): string {
    switch (DEBUG_CREATURE_ID) {
      case -1:
        return "off";
      case 0:
        return "enabled for all creatures";
      case -10:
        return "enabled for creatures 0 to 9";
      case -30:
        return "enabled for creatures 0 to 29";
      default:
        return "enabled for creature id ".concat(DEBUG_CREATURE_ID.toString());
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
  function handleToggleLog() {
    if (worldController) {
        worldController.eventLogger.togglePause();
    }
  }
  function handleDeleteLog() {
    if (worldController) {
        worldController.eventLogger.reset();
    }
  }
  return (
    <div>
      <p className="mb-2 text-lg">Log is: {logStatus()}</p>
      <p className="mb-2 text-lg">{(DEBUG_CREATURE_ID==-1 || !worldController )  ? "" : "Log count: ".concat(logCount.toString()) }</p>
      <div>
        {
        DEBUG_CREATURE_ID!=-1 ? (
            <div>
              <div className="my-3"><Button onClick={handleToggleLog}>{worldController?.eventLogger.isPaused ? "Resume log" : "Pause log"}</Button></div>
              <div className="my-3"><Button onClick={handleSaveLog}>Save log</Button></div>
              <div className="my-3"><Button onClick={handleDeleteLog}>Delete log</Button></div>
            </div>
        ) : (<p></p>)
      }
        </div>
    </div>
  );
}
