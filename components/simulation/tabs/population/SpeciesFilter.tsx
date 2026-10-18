"use client";

import { useId } from "react";
import Button from "@/components/global/Button";

interface Props {
  sensors: string[];
  actions: string[];
  sensor: string; // "" for any
  action: string; // "" for any
  onSensorChange: (sensor: string) => void;
  onActionChange: (action: string) => void;
  message: string;
}

// Shows only the species whose network uses the chosen sensor and/or action
export default function SpeciesFilter({
  sensors,
  actions,
  sensor,
  action,
  onSensorChange,
  onActionChange,
  message,
}: Props) {
  const id = useId();

  const select = (
    kind: "sensor" | "action",
    names: string[],
    value: string,
    onChange: (value: string) => void
  ) => (
    <>
      <label htmlFor={`${id}-${kind}`} className="text-sm">
        {kind === "sensor" ? "Sensor" : "Action"}
      </label>
      <select
        id={`${id}-${kind}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={`${id}-message`}
        className="min-w-0 bg-grey-mid p-1 text-sm"
      >
        <option value="">Any</option>
        {/* keep a chosen name that is no longer enabled, so the filter stays visible */}
        {value !== "" && !names.includes(value) && <option value={value}>{value}</option>}
        {names.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </>
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm">Filter species by</span>
        {select("sensor", sensors, sensor, onSensorChange)}
        {select("action", actions, action, onActionChange)}
        {(sensor !== "" || action !== "") && (
          <Button
            onClick={() => {
              onSensorChange("");
              onActionChange("");
            }}
          >
            Clear filter
          </Button>
        )}
      </div>
      <p id={`${id}-message`} role="status" className="text-xs">
        {message}
      </p>
    </div>
  );
}
