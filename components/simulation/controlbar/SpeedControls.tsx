import React, { useEffect } from "react";
import { ToggleGroup } from "@/components/global/ToggleGroup";
import Toggle from "@/components/global/Toggle";
import classNames from "classnames";
import { worldControllerAtom } from "../store";
import {
  pauseBetweenStepsAtom,
  pauseBetweenGenerationsAtom,
  immediateStepsAtom,
} from "../store/guiControlsAtoms";
import { useAtom, useAtomValue } from "jotai";

// Passes the speed atoms to the world controller. It lives in the control bar, which is always
// mounted, because the SpeedControls panel is not mounted on narrow screens until it is opened.
export function useSpeedSync() {
  const pauseBetweenSteps = useAtomValue(pauseBetweenStepsAtom);
  const pauseBetweenGenerations = useAtomValue(pauseBetweenGenerationsAtom);
  const immediateSteps = useAtomValue(immediateStepsAtom);
  const worldController = useAtomValue(worldControllerAtom);

  useEffect(() => {
    if (worldController) {
      worldController.setSpeed(pauseBetweenSteps, pauseBetweenGenerations, immediateSteps);
    }
  }, [worldController, pauseBetweenSteps, pauseBetweenGenerations, immediateSteps]);
}

interface Props
  extends React.PropsWithChildren,
    React.ComponentPropsWithoutRef<"div"> {}

export function SpeedControls({ className, ...rest }: Props) {
  const [pauseBetweenSteps, setPauseBetweenSteps] = useAtom(pauseBetweenStepsAtom);
  const [pauseBetweenGenerations, setPauseBetweenGenerations] = useAtom(pauseBetweenGenerationsAtom);
  const [immediateSteps, setImmediateSteps] = useAtom(immediateStepsAtom);

  const finalClassName = classNames("flex flex-wrap gap-4 text-xs", className);

  return (
    <div className={finalClassName} {...rest}>
      <div className="flex flex-col items-start gap-1">
        Pause between steps (ms):
        <ToggleGroup
          role="group"
          aria-label="Pause between steps (ms)"
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
          role="group"
          aria-label="Pause between generations (ms)"
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
          role="group"
          aria-label="Immediate steps"
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
