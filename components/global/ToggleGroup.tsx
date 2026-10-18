import classNames from "classnames";
import { PrimitiveAtom, atom } from "jotai";
import React from "react";
import { createContext } from "react";

interface Props extends React.ComponentPropsWithoutRef<"div"> {
  atom?: PrimitiveAtom<any>;
  value?: any;
  onChange?: (checked: any) => void;
}

export const toggleGroupContext = createContext<{
  atom?: PrimitiveAtom<any>;
  value?: any;
  onChange?: (checked: any) => void;
}>({ atom: atom(false) });

export function ToggleGroup({
  className,
  atom,
  value,
  onChange,
  ...rest
}: Props) {
  const finalClassName = classNames(
    "inline-grid auto-cols-fr grid-flow-col",
    className
  );

  return (
    <toggleGroupContext.Provider value={{ atom: atom, value: value, onChange }}>
      <div className={finalClassName} {...rest}></div>
    </toggleGroupContext.Provider>
  );
}
