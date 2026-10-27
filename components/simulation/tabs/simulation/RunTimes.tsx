"use client";

import useWorldValue from "@/hooks/useWorldValue";
import { worldControllerAtom } from "../../store";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

// counts the steps computed during each second; null until the first second has passed
function useStepsPerSecond(): number | null {
  const worldController = useAtomValue(worldControllerAtom);
  const [stepsPerSecond, setStepsPerSecond] = useState<number | null>(null);

  useEffect(() => {
    if (!worldController) return;

    let steps = 0;
    let since = performance.now();
    const countStep = () => steps++;
    const interval = window.setInterval(() => {
      const now = performance.now();
      setStepsPerSecond(Math.round((steps * 1000) / (now - since)));
      steps = 0;
      since = now;
    }, 1000);

    worldController.events.addEventListener(WorldEvents.endStep, countStep);
    return () => {
      worldController.events.removeEventListener(WorldEvents.endStep, countStep);
      window.clearInterval(interval);
    };
  }, [worldController]);

  return stepsPerSecond;
}

export default function RunTimes() {
  const lastGenerationDuration = useWorldValue(
    (worldController) => worldController.lastGenerationDuration,
    0
  );
  const totalTime = useWorldValue((worldController) => worldController.totalTime, 0);
  const isPaused = useWorldValue((worldController) => worldController.isPaused, false);
  const stepsPerSecond = useStepsPerSecond();

  // convert the total time to minutes
  const totalTimeMinutes = (totalTime / 1000 / 60).toFixed(2);

  const waitMessage = "Wait...";

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
      <div>
        <strong>Total time: </strong>
        {totalTime ? <span>{totalTimeMinutes} min</span> : waitMessage}
      </div>
      <div>
        <strong>Last generation duration: </strong>
        {lastGenerationDuration ? <span>{lastGenerationDuration} ms</span> : waitMessage}
      </div>
      <div>
        <strong>Steps per second: </strong>
        {isPaused ? "paused" : stepsPerSecond !== null ? <span className="tabular-nums">{stepsPerSecond}</span> : waitMessage}
      </div>
    </div>
  );
}
