import classNames from "classnames";
import { atom as newAtom, useAtom } from "jotai";
import { useContext, useState } from "react";
import { toggleGroupContext } from "./ToggleGroup";

interface Props
  extends React.PropsWithChildren,
    React.ComponentPropsWithoutRef<"button"> {
  value: any;
}

export default function Toggle({
  children,
  className,
  value: targetValue,
  ...rest
}: Props) {
  const { atom, value, onChange } = useContext(toggleGroupContext);
  const [defaultAtom] = useState(() => newAtom(""));
  const [currentAtomValue, setAtomValue] = useAtom(atom ?? defaultAtom);
  const isActive = (value ?? currentAtomValue) === targetValue;

  const finalClassName = classNames(
    "py-2 px-2 text-sm !leading-none border-2",
    "first:rounded-l-md last:rounded-r-md",
    // selected option stands out from the grey footer and from the other options
    isActive && "bg-white text-grey-dark border-white",
    !isActive && "bg-grey-dark text-white border-grey-dark hover:border-white/50",
    className
  );

  const handleClick = () => {
    if (onChange) {
      onChange(targetValue);
    } else {
      setAtomValue(targetValue);
    }
  };

  return (
    <button
      type="button"
      aria-pressed={isActive}
      {...rest}
      className={finalClassName}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
