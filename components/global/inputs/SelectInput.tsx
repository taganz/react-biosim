import { ReactNode, useId, useState } from "react";
import { PrimitiveAtom, atom as newAtom, useAtom } from "jotai";

interface Props extends React.PropsWithChildren {
  value?: any;
  onChange?: (value: any) => void;
  atom?: PrimitiveAtom<any>;
  label?: ReactNode;
}

export default function SelectInput({
  value,
  onChange,
  atom,
  label,
  children,
}: Props) {
  const id = useId();
  const [defaultAtom] = useState(() => newAtom<any>(0));
  const [currentValue, setCurrentValue] = useAtom(atom ?? defaultAtom);

  return (
    <div className="flex flex-col">
      {label && <label className="grow" htmlFor={id}>{label}</label>}
      <select
        id={id}
        value={(value ?? currentValue).toString()}
        onChange={(e) =>
          onChange ? onChange(e.target.value) : setCurrentValue(e.target.value)
        }
        className="min-w-0 bg-grey-mid p-1"
      >
        {children}
      </select>
    </div>
  );
}
