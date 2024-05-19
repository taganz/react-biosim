import React, { useEffect } from "react";
import { ToggleGroup } from "@/components/global/ToggleGroup";
import Toggle from "@/components/global/Toggle";
import classNames from "classnames";
import {worldControllerAtom} from "../store";
import {atom, useAtom, useAtomValue } from "jotai";
import * as constants from "@/simulation/simulationDataDefault"

interface Props
  extends React.PropsWithChildren,
    React.ComponentPropsWithoutRef<"div"> {}

    
export const pauseBetweenStepsAtom = atom(0);
export const pauseBetweenGenerationsAtom = atom(0);
export const immediateStepsAtom = atom(1);

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
      worldController.immediateSteps = immediateSteps;
      //console.log("FooterSpeedControls - updated immediateSteps:", immediateSteps, worldController.immediateSteps);
    }
    else {
      console.log("FooterSpeedControls - worldController not found!");
    }
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
          <Toggle value={4000}>4000</Toggle>
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
