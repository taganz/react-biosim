import { ReactNode, useId, useState } from "react";
import classNames from "classnames";

interface Props {
  value: number;
  onChange: (value: number) => void;
  label?: ReactNode;
  step?: number;
  min?: number;
  max?: number;
  integer?: boolean;
}

// While the field has focus the typed text is kept locally, so it can be empty
// or out of range for a moment; only valid numbers are passed to onChange
export default function NumberInput({
  value,
  onChange,
  label,
  step,
  min,
  max,
  integer = false,
}: Props) {
  const id = useId();
  const errorId = `${id}-error`;
  const [text, setText] = useState(String(value));
  const [isEditing, setIsEditing] = useState(false);

  const parse = (raw: string): number | undefined => {
    if (raw.trim() === "") return undefined;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return undefined;
    if (integer && !Number.isInteger(parsed)) return undefined;
    if (min !== undefined && parsed < min) return undefined;
    if (max !== undefined && parsed > max) return undefined;
    return parsed;
  };

  const isInvalid = isEditing && parse(text) === undefined;

  const rangeMessage = [
    integer ? "Whole number" : "Number",
    min !== undefined && max !== undefined && `between ${min} and ${max}`,
    min !== undefined && max === undefined && `of at least ${min}`,
    min === undefined && max !== undefined && `up to ${max}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col">
      {label && (
        <label className="grow" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        type="number"
        value={isEditing ? text : String(value)}
        onFocus={() => {
          setText(String(value));
          setIsEditing(true);
        }}
        onChange={(e) => {
          setText(e.target.value);
          const parsed = parse(e.target.value);
          if (parsed !== undefined) onChange(parsed);
        }}
        // the field shows the last valid value again when it loses focus
        onBlur={() => setIsEditing(false)}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? errorId : undefined}
        className={classNames(
          "w-0 min-w-full bg-grey-mid p-1 text-sm",
          isInvalid && "outline outline-2 outline-red"
        )}
        step={step}
        min={min}
        max={max}
      />
      {isInvalid && (
        <span id={errorId} className="mt-1 text-xs">
          {rangeMessage}
        </span>
      )}
    </div>
  );
}
