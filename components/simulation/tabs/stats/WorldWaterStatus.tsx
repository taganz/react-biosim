"use client";

import React from "react";
import useWorldValue from "@/hooks/useWorldValue";

export default function WorldWaterStatus() {
  const totalWater = useWorldValue((world) => world.worldWater.totalWater, 0);
  const waterInCloud = useWorldValue((world) => world.worldWater.waterInCloud, 0);
  const waterInCells = useWorldValue((world) => world.worldWater.waterInCells, 0);
  const waterInCreatures = useWorldValue((world) => world.worldWater.waterInCreatures, 0);

  return (
<div className="bg-blue-100 p-4 rounded-lg shadow">
  <h2 className="font-bold text-lg text-gray-800 mb-2">World Water Stats</h2>
  <p className="text-gray-700">
    <span className="font-semibold">Total Water:</span> {totalWater.toFixed(1)}
  </p>
  <p className="text-gray-700">
    <span className="font-semibold">Water in Cloud:</span> {waterInCloud.toFixed(1)}
  </p>
  <p className="text-gray-700">
    <span className="font-semibold">Water in Cells:</span> {waterInCells.toFixed(1)}
  </p>
  <p className="text-gray-700">
    <span className="font-semibold">Water in Creatures:</span> {waterInCreatures.toFixed(1)}
  </p>
</div>
  );
}
