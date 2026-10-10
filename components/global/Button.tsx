import classNames from "classnames";
import { ReactNode } from "react";

interface Props
  extends React.PropsWithChildren,
    React.ComponentPropsWithoutRef<"button"> {
  variant?: "dark" | "danger" | "grey";
  icon?: ReactNode;
}

export default function Button({
  children,
  className,
  variant = "danger",
  icon,
  ...rest
}: Props) {
  const onlyIcon = !!(icon && !children);

  const finalClassName = classNames(
    "flex-center gap-2 text-sm lg:text-base hover:brightness-90 rounded-md",
    !onlyIcon && "py-1 px-3 lg:py-2 lg:px-4",
    onlyIcon && "p-1 lg:p-2 aspect-square",
    variant === "dark" && "bg-grey-dark text-white",
    variant === "danger" && "bg-red text-white",
    variant === "grey" && "bg-grey-mid text-white",
    className
  );

  return (
    <button className={finalClassName} {...rest}>
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
