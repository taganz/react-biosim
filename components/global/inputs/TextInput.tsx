import { ReactNode, useId, useState } from "react";
import classNames from "classnames";

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: ReactNode;
  maxLength?: number;
  // characters that match are removed while typing
  disallowed?: RegExp;
}

// Like NumberInput: while the field has focus the typed text is kept locally,
// so it can be empty for a moment; only non-empty values are passed to onChange
export default function TextInput({ value, onChange, label, maxLength, disallowed }: Props) {
  const id = useId();
  const [text, setText] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  const isInvalid = isEditing && text === "";

  return (
    <div className="flex flex-col">
      {label && (
        <label className="grow" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        type="text"
        value={isEditing ? text : value}
        maxLength={maxLength}
        onFocus={() => {
          setText(value);
          setIsEditing(true);
        }}
        onChange={(e) => {
          const cleaned = disallowed ? e.target.value.replace(disallowed, "") : e.target.value;
          setText(cleaned);
          if (cleaned !== "") onChange(cleaned);
        }}
        // the field shows the last valid value again when it loses focus
        onBlur={() => setIsEditing(false)}
        aria-invalid={isInvalid}
        className={classNames(
          "w-0 min-w-full bg-grey-mid p-1 text-sm",
          isInvalid && "outline outline-2 outline-red"
        )}
      />
    </div>
  );
}
