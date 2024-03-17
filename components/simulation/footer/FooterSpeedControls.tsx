import React from "react";
import { ToggleGroup } from "@/components/global/ToggleGroup";
import Toggle from "@/components/global/Toggle";
import classNames from "classnames";
import useWorldProperty from "@/hooks/useWorldProperty";

interface Props
  extends React.PropsWithChildren,
    React.ComponentPropsWithoutRef<"div"> {}

export function FooterSpeedControls({ className, ...rest }: Props) {
  const finalClassName = classNames(
    "flex flex-wrap gap-4 text-xs lg:text-sm",
    className
  );

  const [pauseBetweenSteps, setPauseBetweenSteps] = useWorldProperty<number>(
    (world) => world.timePerStep,
    (world, value) => (world.timePerStep = value),
    0
  );
  const [pauseBetweenGenerations, setPauseBetweenGenerations] =
    useWorldProperty(
      (world) => world.pauseBetweenGenerations,
      (world, value) => (world.pauseBetweenGenerations = value),
      0
    );
  const [immediateSteps, setImmediateSteps] = useWorldProperty(
    (world) => world.immediateSteps,
    (world, value) => (world.immediateSteps = value),
    1
  );

  return (
    <div className={finalClassName} {...rest}>
      <div className="flex flex-col items-start gap-1">
        Pause between steps (ms):
        <ToggleGroup
          value={pauseBetweenSteps}
          onChange={(value) => setPauseBetweenSteps(value)}
        >
          <Toggle value={0}>0</Toggle>
          <Toggle value={10}>10</Toggle>
          <Toggle value={50}>50</Toggle>
          <Toggle value={200}>200</Toggle>
        </ToggleGroup>
      </div>
      <div className="flex flex-col items-start gap-1">
        Pause between generations (ms):
        <ToggleGroup
          value={pauseBetweenGenerations}
          onChange={(value) => setPauseBetweenGenerations(value)}
        >
          <Toggle value={0}>0</Toggle>
          <Toggle value={1000}>1000</Toggle>
          <Toggle value={2000}>4000</Toggle>
        </ToggleGroup>
      </div>
      <div className="flex flex-col items-start gap-1">
        Immediate steps:
        <ToggleGroup
          value={immediateSteps}
          onChange={(value) => setImmediateSteps(value)}
        >
          <Toggle value={1}>1</Toggle>
          <Toggle value={20}>20</Toggle>
          <Toggle value={200}>200</Toggle>
        </ToggleGroup>
      </div>
    </div>
  );
}
