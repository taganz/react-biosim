"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { simulationDataAtom, worldControllerAtom } from "../../store";
import CheckboxInput from "@/components/global/inputs/CheckboxInput";
import NumberInput from "@/components/global/inputs/NumberInput";
import SelectInput from "@/components/global/inputs/SelectInput";
import TextInput from "@/components/global/inputs/TextInput";
import { LogOptions } from "@/simulation/logger/EventLogger";
import { AllowedLogEvents, LogEvent, LogLevel } from "@/simulation/logger/LogEvent";
import useWorldValue from "@/hooks/useWorldValue";

const LEVEL_OPTIONS: [LogLevel, string][] = [
  [LogLevel.CREATURE, "Creature events and all totals"],
  [LogLevel.STEP, "Step totals, generation totals and world events"],
  [LogLevel.GENERATION, "Generation totals and world events"],
  [LogLevel.WORLD, "World events only"],
];

const CREATURE_EVENTS: LogEvent[] = [
  LogEvent.INFO,
  LogEvent.BIRTH,
  LogEvent.DEAD,
  LogEvent.DEAD_ATTACKED,
  LogEvent.METABOLISM,
  LogEvent.PHOTOSYNTHESIS,
  LogEvent.REPRODUCE,
  LogEvent.REPRODUCE_TRY,
  LogEvent.ATTACK,
  LogEvent.ATTACK_TRY,
  LogEvent.MOVE,
  LogEvent.MOVE_TRY,
];
const WORLD_EVENTS: LogEvent[] = [LogEvent.GENERATION_START, LogEvent.GENERATION_END, LogEvent.STEP_END];

const NO_EVENTS = {} as AllowedLogEvents;

function isSupportedLocale(locale: string): boolean {
  try {
    return Intl.NumberFormat.supportedLocalesOf(locale).length > 0;
  } catch {
    return false;
  }
}

// Logger settings (LOG_* constants). They apply at once to the running simulation,
// and to the Settings draft so that Update simulation and Restart keep them.
export default function LoggerOptions() {
  const worldController = useAtomValue(worldControllerAtom);
  const setSimulationData = useSetAtom(simulationDataAtom);
  const logEnabled = useWorldValue((world) => Boolean(world.simData.constants.LOG_ENABLED), false);
  const logLevel = useWorldValue((world) => world.eventLogger.logLevel, LogLevel.STEP);
  const maxEvents = useWorldValue((world) => world.eventLogger.maxEvents, 0);
  const locale = useWorldValue((world) => String(world.simData.constants.LOG_LOCALE_STRING ?? ""), "");
  // the constants object is replaced on every change, so the reference is stable in between
  const allowedEvents = useWorldValue(
    (world) => (world.simData.constants.LOG_ALLOWED_EVENTS as AllowedLogEvents | undefined) ?? NO_EVENTS,
    NO_EVENTS
  );

  const setOptions = (options: Partial<LogOptions>) => {
    if (!worldController) return;
    const previous = worldController.simData;
    const updated = worldController.setLogOptions(options);
    // with no pending changes the draft is the running simData, and it stays so
    setSimulationData((prev) =>
      prev === previous ? updated : { ...prev, constants: { ...prev.constants, ...options } }
    );
  };

  const setEventAllowed = (event: LogEvent, allowed: boolean) =>
    setOptions({ LOG_ALLOWED_EVENTS: { ...allowedEvents, [event]: allowed } });

  const eventCheckbox = (event: LogEvent) => (
    <CheckboxInput
      key={event}
      id={`log-event-${event}`}
      label={event}
      checked={Boolean(allowedEvents[event])}
      onChange={(checked) => setEventAllowed(event, checked)}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <CheckboxInput
        id="log-enabled"
        label="Enable logger"
        checked={logEnabled}
        onChange={(checked) => setOptions({ LOG_ENABLED: checked })}
      />

      {logEnabled && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectInput
              label="Level"
              value={logLevel}
              onChange={(value) => setOptions({ LOG_LEVEL: value as LogLevel })}
            >
              {LEVEL_OPTIONS.map(([level, label]) => (
                <option key={level} value={level}>{label}</option>
              ))}
            </SelectInput>
            <NumberInput
              label="Maximum events"
              value={maxEvents}
              onChange={(value) => setOptions({ LOG_EVENTLOGGER_MAX_EVENTS: value })}
              min={1}
              integer
            />
            <TextInput
              label="Number format (locale)"
              value={locale}
              onChange={(value) => {
                // an unknown locale would make toLocaleString throw while logging
                if (isSupportedLocale(value)) setOptions({ LOG_LOCALE_STRING: value });
              }}
            />
          </div>
          <p className="text-xs">
            The logger pauses when it reaches the maximum. The locale sets the decimal separator of the
            values, for example es-ES (1,5) or en-US (1.5).
          </p>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-bold">Events to record</legend>
            <p className="text-xs">Creature events (also counted in the step and generation totals):</p>
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {CREATURE_EVENTS.map(eventCheckbox)}
            </div>
            <p className="text-xs">World events:</p>
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {WORLD_EVENTS.map(eventCheckbox)}
            </div>
          </fieldset>
        </>
      )}
    </div>
  );
}
