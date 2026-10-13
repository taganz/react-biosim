"use client";

import React from "react";
import { useAtom } from "jotai";
import useWorldValue from "@/hooks/useWorldValue";
import { showWaterAtom } from "../../store/guiControlsAtoms";

export default function WorldWaterStatus() {
  const totalWater = useWorldValue((world) => world.worldWater.totalWater, 0);
  const waterInCloud = useWorldValue((world) => world.worldWater.waterInCloud, 0);
  const waterInCells = useWorldValue((world) => world.worldWater.waterInCells, 0);
  const waterInCreatures = useWorldValue((world) => world.worldWater.waterInCreatures, 0);
  const [showWater, setShowWater] = useAtom(showWaterAtom);

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xl font-bold">Water</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4">
        <dt>Total water</dt>
        <dd>{totalWater.toFixed(1)}</dd>
        <dt>Water in cloud</dt>
        <dd>{waterInCloud.toFixed(1)}</dd>
        <dt>Water in cells</dt>
        <dd>{waterInCells.toFixed(1)}</dd>
        <dt>Water in creatures</dt>
        <dd>{waterInCreatures.toFixed(1)}</dd>
      </dl>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showWater}
          onChange={(e) => setShowWater(e.target.checked)}
        />
        Show water in cells
      </label>
    </section>
  );
}
