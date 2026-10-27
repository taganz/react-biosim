import { ReactNode, useState } from "react";
import { PrimitiveAtom, atom as newAtom, useAtom } from "jotai";

interface Props {
  id: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  atom?: PrimitiveAtom<boolean>;
  label?: ReactNode;
}

export default function NumberInput({
  id,
  checked,
  onChange,
  atom,
  label,
}: Props) {
  const [defaultAtom] = useState(() => newAtom(false));
  const [currentValue, setCurrentValue] = useAtom(atom ?? defaultAtom);

  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked ?? currentValue}
        onChange={(e) =>
          onChange
            ? onChange(e.target.checked)
            : setCurrentValue(e.target.checked)
        }
        className="inline-block h-4 w-4 min-w-0 shrink-0 bg-grey-mid p-2"
      />
      {label && (
        <label className="grow text-sm" htmlFor={id}>
          {label}
        </label>
      )}
    </div>
  );
}
