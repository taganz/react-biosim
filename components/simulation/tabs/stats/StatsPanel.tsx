"use client";

import { useCallback } from "react";
import { SingleGeneration } from "@/simulation/world/stats/GenerationRegistry";
import LinearGraph from "@/components/global/graphs/LinearGraph";
import WorldWaterStatus from "./WorldWaterStatus";
import LoggerStatus from "./LoggerStatus";
import useWorldValue from "@/hooks/useWorldValue";

const NO_GENERATIONS: SingleGeneration[] = [];

function getter(data: SingleGeneration): [number, number] {
  return [data.generation, data.maxFitnessValue];
}

export default function StatsPanel() {
  // generationRegistry is replaced on restart, so read it through the hook instead of caching it
  const data = useWorldValue((world) => world.generationRegistry.generations, NO_GENERATIONS);
  // generations are pushed into the same array, so use the generation number to trigger graph redraws
  const currentGen = useWorldValue((world) => world.currentGen, 0);
  const fitnessValueName = useWorldValue(
    (world) => world.generations.selectionMethod.fitnessValueName,
    ""
  );
  const lastFitnessMaxValue = useWorldValue(
    (world) => world.generations.lastFitnessMaxValue,
    0
  );

  const maxFitnessFormatter = useCallback(
    (value: number) => {
      return ((value ).toFixed(1).toString());
    },
    []
  );

  const generationFormatter = useCallback((value: number) => {
    return "Generation #" + Math.round(value).toString();
  }, []);

  return (
    <div className="flex flex-col gap-10">
    <div>
      <h3 className="mb-1 text-2xl font-bold">{fitnessValueName}</h3>
      <p>{`maxFitnessValue: ${maxFitnessFormatter(lastFitnessMaxValue)}`}</p>
      <LinearGraph
        data={data}
        getter={getter}
        updateKey={currentGen}
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
     </div>

      <details>
        <summary className="cursor-pointer text-2xl font-bold">
          Under development: logger and water
        </summary>
        <div className="mt-4 flex flex-col gap-6">
          <section className="flex flex-col gap-2">
            <h3 className="text-xl font-bold">Logger</h3>
            <p>Logger creates a .csv file. A powerbi report is available in github public folder</p>
            <LoggerStatus/>
          </section>
          <WorldWaterStatus/>
        </div>
      </details>
  </div>
  );
}
