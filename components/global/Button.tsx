import classNames from "classnames";
import { ReactNode } from "react";

// Variants:
//  primary - the main action of an area (play/pause, apply settings)
//  grey    - regular actions (default)
//  dark    - secondary actions, mainly on grey surfaces
//  danger  - actions that lose data (restart, delete)
interface Props
  extends React.PropsWithChildren,
    React.ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "grey" | "dark" | "danger";
  icon?: ReactNode;
}

export default function Button({
  children,
  className,
  variant = "grey",
  icon,
  type = "button",
  ...rest
}: Props) {
  const onlyIcon = !!(icon && !children);

  const finalClassName = classNames(
    "flex-center gap-2 text-sm lg:text-base hover:brightness-90 rounded-md",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100",
    !onlyIcon && "py-1 px-3 lg:py-2 lg:px-4",
    onlyIcon && "p-1 lg:p-2 aspect-square",
    variant === "primary" && "bg-blue text-white",
    variant === "dark" && "bg-grey-dark text-white",
    variant === "danger" && "bg-red text-white",
    variant === "grey" && "bg-grey-mid text-white",
    className
  );

  return (
    <button type={type} className={finalClassName} {...rest}>
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
