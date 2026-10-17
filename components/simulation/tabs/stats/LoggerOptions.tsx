"use client";

import CheckboxInput from "@/components/global/inputs/CheckboxInput";
import NumberInput from "@/components/global/inputs/NumberInput";
import SelectInput from "@/components/global/inputs/SelectInput";
import { AllowedLogEvents, LogEvent } from "@/simulation/logger/LogEvent";
import useWorldValue from "@/hooks/useWorldValue";
import useSetLogOptions from "./useSetLogOptions";

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

// the decimal separator of the values; a file can bring another locale, which is kept in the list
const LOCALES: [string, string][] = [
  ["es-ES", "es-ES (1,5)"],
  ["en-US", "en-US (1.5)"],
];

// Logger settings (LOG_* constants), see useSetLogOptions; Enable logger is in LoggerPanel
export default function LoggerOptions() {
  const setOptions = useSetLogOptions();
  const stepTotals = useWorldValue((world) => world.simData.constants.LOG_STEP_TOTALS !== false, true);
  const maxEvents = useWorldValue((world) => world.eventLogger.maxEvents, 0);
  const locale = useWorldValue((world) => String(world.simData.constants.LOG_LOCALE_STRING ?? ""), "");
  // the constants object is replaced on every change, so the reference is stable in between
  const allowedEvents = useWorldValue(
    (world) => (world.simData.constants.LOG_ALLOWED_EVENTS as AllowedLogEvents | undefined) ?? NO_EVENTS,
    NO_EVENTS
  );

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
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberInput
          label="Maximum events"
          value={maxEvents}
          onChange={(value) => setOptions({ LOG_EVENTLOGGER_MAX_EVENTS: value })}
          min={1}
          integer
        />
        <SelectInput
          label="Number format (locale)"
          value={locale}
          onChange={(value) => setOptions({ LOG_LOCALE_STRING: value })}
        >
          {LOCALES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
          {!LOCALES.some(([value]) => value === locale) && <option value={locale}>{locale}</option>}
        </SelectInput>
      </div>
      <p className="text-xs">
        The logger stops when it reaches the maximum. The locale sets the decimal separator of the values.
      </p>

      <div className="flex flex-col gap-1">
        <CheckboxInput
          id="log-step-totals"
          label="Step totals"
          checked={stepTotals}
          onChange={(checked) => setOptions({ LOG_STEP_TOTALS: checked })}
        />
        <p className="text-xs">
          How many times each creature event happened in each step. Turn them off for long recordings: the
          generation totals and the world events are always written.
        </p>
      </div>

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
    </div>
  );
}
