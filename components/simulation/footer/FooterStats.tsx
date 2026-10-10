"use client";

import useWorldValue from "@/hooks/useWorldValue";
import React from "react";

export default function FooterStats() {
  const lastGenerationDuration = useWorldValue(
    (worldController) => worldController.lastGenerationDuration,
    0
  );
  const totalTime = useWorldValue((worldController) => worldController.totalTime, 0);
  const lastSurvivorCount = useWorldValue(
    (worldController) => worldController.generations.lastSurvivorsCount,
    0
  );
  const lastSurvivalRate = useWorldValue(
    (worldController) => worldController.generations.lastSurvivalRate,
    0
  );

  // Convert the survival rate from range [0, 1] to [0, 100]
  const survivalRatePercentage = (lastSurvivalRate * 100).toFixed(2);

  // Conver the total time to minutes and
  const totalTimeMinutes = (totalTime / 1000 / 60).toFixed(2);

  const waitMessage = "Wait...";

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs lg:grid lg:grid-cols-2">
      <div>
        <strong>Survivors: </strong>
        {lastSurvivorCount ? (
          <span className="inline-block min-w-[80px]">
            {lastSurvivorCount} ({survivalRatePercentage}%)
          </span>
        ) : (
          waitMessage
        )}
      </div>

      <div>
        <strong>Total time: </strong>
        {totalTime ? <span>{totalTimeMinutes} min</span> : waitMessage}
      </div>

      <div className="col-span-2">
        <strong>Last generation duration: </strong>
        {lastGenerationDuration ? (
          <span className="inline-block min-w-[60px]">
            {lastGenerationDuration} ms
          </span>
        ) : (
          waitMessage
        )}
      </div>
    </div>
  );
}
