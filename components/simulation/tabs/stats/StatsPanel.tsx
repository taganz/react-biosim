"use client";

import { useCallback, useEffect, useState } from "react";
import { worldControllerAtom, restartCountAtom } from "../../store";
import { useAtom, useAtomValue } from "jotai";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import { SingleGeneration } from "@/simulation/world/stats/GenerationRegistry";
import LinearGraph from "@/components/global/graphs/LinearGraph";
import useWorldPropertyValue from "@/hooks/useWorldPropertyValue";

function getter(data: SingleGeneration): [number, number] {
  //return [data.generation, data.survivorCount];
  return [data.generation, data.maxFitnessValue];
}

export default function StatsPanel() {
  const worldController = useAtomValue(worldControllerAtom);
  const [data, setData] = useState<SingleGeneration[]>([]);
  const [updates, setUpdates] = useState(0);
  const restartCount = useAtom(restartCountAtom);

  const initialPopulation = useWorldPropertyValue(
    (worldController) => worldController.initialPopulation,
    0
  );

  const maxFitnessFormatter = useCallback(
    (value: number) => {
      //return ((value / initialPopulation) * 100).toFixed(1).toString() + "%";
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

  // Bind worldController events
  useEffect(() => {
    if (worldController) {
      setData(worldController.generationRegistry.generations);

      worldController.events.addEventListener(
        WorldEvents.startGeneration,
        onStartGeneration
      );
      console.log("worldController.selectionMethod.fitnessValueName", worldController.selectionMethod.fitnessValueName);
      return () => {
        worldController.events.removeEventListener(
          WorldEvents.startGeneration,
          onStartGeneration
        );
      };
    }
  }, [onStartGeneration, worldController, restartCount]);

  return (
    <div>
      <h3 className="mb-1 text-2xl font-bold">{worldController == null ? "<error worldController == null>" : worldController?.selectionMethod.fitnessValueName}</h3>
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
    </div>
  );
}
