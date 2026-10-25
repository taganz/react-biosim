"use client";

import CheckboxInput from "@/components/global/inputs/CheckboxInput";
import useWorldValue from "@/hooks/useWorldValue";
import LoggerStatus from "./LoggerStatus";
import LoggerOptions from "./LoggerOptions";
import useSetLogOptions from "./useSetLogOptions";

// Enable logger, and the rest of the logger only while it is enabled
export default function LoggerPanel() {
  const setOptions = useSetLogOptions();
  const logEnabled = useWorldValue((world) => Boolean(world.simData.constants.LOG_ENABLED), false);
  const logCount = useWorldValue((world) => world.eventLogger.logCount, 0);
  const hasUnsavedRows = useWorldValue((world) => world.eventLogger.hasUnsavedRows, false);

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-2xl font-bold">Logger</h3>
      <p>
        Records the events of the simulation in a .csv file. A Power BI report to analyse it is in the public folder
        of the GitHub repository.
      </p>
      <CheckboxInput
        id="log-enabled"
        label="Enable logger"
        checked={logEnabled}
        onChange={(checked) => {
          // turning it off deletes the log
          if (!checked && hasUnsavedRows
            && !window.confirm(`The log has ${logCount} events that are not saved. Turning the logger off deletes them.`)) {
            return;
          }
          setOptions({ LOG_ENABLED: checked });
        }}
      />

      {logEnabled && (
        <>
          <section className="flex flex-col gap-2">
            <h4 className="text-xl font-bold">Recording</h4>
            <LoggerStatus />
          </section>
          <section className="flex flex-col gap-2">
            <h4 className="text-xl font-bold">Logger options</h4>
            <LoggerOptions />
          </section>
        </>
      )}
    </section>
  );
}
