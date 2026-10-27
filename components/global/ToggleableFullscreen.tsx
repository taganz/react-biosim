import useDisableBodyScroll from "@/hooks/useDisableBodyScroll";
import classNames from "classnames";
import { useEffect } from "react";

interface Props
  extends React.PropsWithChildren,
    React.ComponentPropsWithoutRef<"div"> {
  enable?: boolean;
}

export default function ToggleableFullscreen({
  children,
  className,
  enable,
  ...rest
}: Props) {
  const { setIsScrollDisabled } = useDisableBodyScroll();

  useEffect(() => {
    setIsScrollDisabled(!!enable);
  }, [enable, setIsScrollDisabled]);

  const finalClassName = classNames(
    enable && "fixed w-full h-full top-0 left-0 z-50 overflow-y-scroll",
    className
  );

  return (
    <div {...rest} className={finalClassName}>
      {children}
    </div>
  );
}
