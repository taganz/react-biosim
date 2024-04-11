import React, { useEffect } from "react";
import { ToggleGroup } from "@/components/global/ToggleGroup";
import Toggle from "@/components/global/Toggle";
import classNames from "classnames";
import {pauseBetweenStepsAtom, pauseBetweenGenerationsAtom, immediateStepsAtom} from "../store/guiControlsAtoms";
import {worldControllerAtom} from "../store";
import { useAtom, useAtomValue } from "jotai";

interface Props
  extends React.PropsWithChildren,
    React.ComponentPropsWithoutRef<"div"> {}

export function FooterSpeedControls({ className, ...rest }: Props) {
  const [pauseBetweenSteps, setPauseBetweenSteps] = useAtom(pauseBetweenStepsAtom);
  const [pauseBetweenGenerations, setPauseBetweenGenerations] = useAtom(pauseBetweenGenerationsAtom);
  const [immediateSteps, setImmediateSteps] = useAtom(immediateStepsAtom);
  const worldController = useAtomValue(worldControllerAtom);

  const finalClassName = classNames(
    "flex flex-wrap gap-4 text-xs lg:text-sm",
    className
  );

  useEffect(()=>{
    if (worldController) {
      worldController.pauseBetweenSteps = pauseBetweenSteps;
      worldController.pauseBetweenGenerations = pauseBetweenGenerations;
    }
    //console.log("FooterSpeedControls ", immediateSteps);
  }, [worldController, pauseBetweenSteps, pauseBetweenGenerations, immediateSteps]);

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
