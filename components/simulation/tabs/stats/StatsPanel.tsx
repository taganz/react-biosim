"use client";

import { useCallback, useEffect, useState } from "react";
import { worldAtom } from "../../store";
import { useAtomValue } from "jotai";
import { WorldEvents } from "@/simulation/events/WorldEvents";
import { SingleGeneration } from "@/simulation/world/stats/GenerationRegistry";
import LinearGraph from "@/components/global/graphs/LinearGraph";
import useWorldPropertyValue from "@/hooks/useWorldPropertyValue";

function getter(data: SingleGeneration): [number, number] {
  //return [data.generation, data.survivorCount];
  return [data.generation, data.maxFitnessValue];
}

export default function StatsPanel() {
  const world = useAtomValue(worldAtom);
  const [data, setData] = useState<SingleGeneration[]>([]);
  const [updates, setUpdates] = useState(0);

  const initialPopulation = useWorldPropertyValue(
    (world) => world.initialPopulation,
    0
  );

  const maxFitnessFormatter = useCallback(
    (value: number) => {
      //return ((value / initialPopulation) * 100).toFixed(1).toString() + "%";
      return ((value ).toFixed(1).toString());
    },
    [initialPopulation]
  );

  const generationFormatter = useCallback((value: number) => {
    return "Generation #" + Math.round(value).toString();
  }, []);

  const onStartGeneration = useCallback(() => {
    setUpdates((value) => value + 1);
  }, []);

  // Bind world events
  useEffect(() => {
    if (world) {
      setData(world.generationRegistry.generations);

      world.events.addEventListener(
        WorldEvents.startGeneration,
        onStartGeneration
      );
      console.log("world.selectionMethod.fitnessValueName", world.selectionMethod.fitnessValueName);
      return () => {
        world.events.removeEventListener(
          WorldEvents.startGeneration,
          onStartGeneration
        );
      };
    }
  }, [onStartGeneration, world]);

  return (
    <div>
      <h3 className="mb-1 text-2xl font-bold">{world == null ? "<error world == null>" : world?.selectionMethod.fitnessValueName}</h3>
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
