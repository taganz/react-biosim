"use client";

import React, { useEffect } from "react";
import {worldControllerAtom} from "../../store";
import {atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import Button from "@/components/global/Button";
import { saveAs } from "file-saver";
import useEventLoggerPropertyValue from "@/hooks/useEventLoggerPropertyValue";
import useWorldPropertyValue from "@/hooks/useWorldPropertyValue";
import { error } from "console";
import Creature from "@/simulation/creature/Creature";



const logCreatureIdAtom = atom(0);


//TODO refresh log count
export default function WorldWaterStatus() {
  const worldController = useAtomValue(worldControllerAtom);
  const waterInCreatures = useWorldPropertyValue((world) => world.worldWater.waterInCreatures, 0);


  return (
<div className="bg-blue-100 p-4 rounded-lg shadow">
  <h2 className="font-bold text-lg text-gray-800 mb-2">World Water Stats</h2>
  <p className="text-gray-700">
    <span className="font-semibold">Total Water:</span> {worldController?.worldWater.totalWater.toFixed(1)}
  </p>
  <p className="text-gray-700">
    <span className="font-semibold">Water in Cloud:</span> {worldController?.worldWater.waterInCloud.toFixed(1)}
  </p>
  <p className="text-gray-700">
    <span className="font-semibold">Water in Cells:</span> {worldController?.worldWater.waterInCells.toFixed(1)}
  </p>
  <p className="text-gray-700">
    <span className="font-semibold">Water in Creatures:</span> {worldController?.worldWater.waterInCreatures.toFixed(1)}
  </p>
</div>
  );
}
