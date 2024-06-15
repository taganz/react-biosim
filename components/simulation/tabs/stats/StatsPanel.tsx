"use client";

import { useCallback, useEffect, useState } from "react";
import { worldControllerAtom } from "../../store";
import { useAtom, useAtomValue } from "jotai";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import { SingleGeneration } from "@/simulation/world/stats/GenerationRegistry";
import LinearGraph from "@/components/global/graphs/LinearGraph";
import { TestStats } from "./TestStats";
import WorldWaterStatus from "./WorldWaterStatus";
import LoggerStatus from "./LoggerStatus";
//import useWorldPropertyValue from "@/hooks/useWorldPropertyValue";

function getter(data: SingleGeneration): [number, number] {
  return [data.generation, data.maxFitnessValue];
}

export default function StatsPanel() {
  const worldController = useAtomValue(worldControllerAtom);
  const [data, setData] = useState<SingleGeneration[]>([]);
  const [updates, setUpdates] = useState(0);
  //const restartCount = useAtom(restartCountAtom);
 // const currentGen = useAtomValue(currentGenAtom);

  const maxFitnessFormatter = useCallback(
    (value: number) => {
      return ((value ).toFixed(1).toString());
    },
    []
  );

  const generationFormatter = useCallback((value: number) => {
    return "Generation #" + Math.round(value).toString();
  }, []);

  const onStartGeneration = useCallback(() => {
    setUpdates((value) => value + 1);
  }, []);

  // Bind worldController events - startGeneration
  useEffect(() => {
    if (worldController) {
      setData(worldController.generationRegistry.generations);

      worldController.events.addEventListener(
        WorldEvents.startGeneration,
        onStartGeneration
      );
      //console.log("worldController.selectionMethod.fitnessValueName", worldController.generations.selectionMethod.fitnessValueName);
      return () => {
        worldController.events.removeEventListener(
          WorldEvents.startGeneration,
          onStartGeneration
        );
      };
    }
  }, [onStartGeneration, worldController]);

  return (
    <div>
    <div>
      <h3 className="mb-1 text-2xl font-bold">{worldController == null ? "<error worldController == null>" : worldController?.generations.selectionMethod.fitnessValueName}</h3>
      <p>{ "maxFitnessValue: PENDING"}</p>
      <LinearGraph
        data={data}
        getter={getter}
        updateKey={updates}
        preSmooth={true}
        preSmoothSamples={10}
        preSmoothRadius={1}
        postSmooth={true}
        postSmoothness={2}
        xLabelFormatter={generationFormatter}
        yLabelFormatter={maxFitnessFormatter}
        className="aspect-[2/1] w-full bg-white"
      />
     {/* TODO genus graph.... */ }
     {/* <TestStats></TestStats>   */}
     </div>
     <br/><br/>
      <h3 className="mb-1 text-2xl font-bold">Under development features</h3>
      <br/>
      <h3 className="mb-1 text-2xl font-bold">Logger</h3>
      <p>Logger creates a .csv file. A powerbi report is available in github public folder</p><br/>
      <LoggerStatus/>
      <br/>
      <WorldWaterStatus/>

  </div>
  );
}
