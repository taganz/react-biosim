"use client";

import useWorldValue from "@/hooks/useWorldValue";
import React from "react";

export default function RunTimes() {
  const lastGenerationDuration = useWorldValue(
    (worldController) => worldController.lastGenerationDuration,
    0
  );
  const totalTime = useWorldValue((worldController) => worldController.totalTime, 0);

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
    </div>
  );
}
