"use client";

import { useCallback } from "react";
import { SingleGeneration } from "@/simulation/world/stats/GenerationRegistry";
import LinearGraph from "@/components/global/graphs/LinearGraph";
import RunTimes from "./RunTimes";
import useWorldValue from "@/hooks/useWorldValue";
import CollapsibleSection from "../CollapsibleSection";

const NO_GENERATIONS: SingleGeneration[] = [];

function getter(data: SingleGeneration): [number, number] {
  return [data.generation, data.maxFitnessValue];
}

// Fitness per generation (the survival rate, for Inside Reproduction Area), in a collapsible section
export default function FitnessGraph() {
  // generationRegistry is replaced on restart, so read it through the hook instead of caching it
  const data = useWorldValue((world) => world.generationRegistry.generations, NO_GENERATIONS);
  // generations are pushed into the same array, so use the generation number to trigger graph redraws
  const currentGen = useWorldValue((world) => world.currentGen, 0);
  const isContinuous = useWorldValue((world) => world.generations.isContinuous, false);
  // continuous runs have no selection method: the plotted value is the population
  const fitnessValueName = useWorldValue(
    (world) => world.generations.isContinuous
      ? "Population"
      : world.generations.selectionMethod.fitnessValueName,
    ""
  );
  const lastBirths = useWorldValue((world) => world.generations.lastBirths, 0);
  const lastDeaths = useWorldValue((world) => world.generations.lastDeaths, 0);
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
    <CollapsibleSection title={fitnessValueName}>
      {isContinuous ? (
        <p>{`At the end of the last generation: ${lastFitnessMaxValue} creatures, ${lastBirths} births and ${lastDeaths} deaths during it.`}</p>
      ) : (
        <p>{`maxFitnessValue: ${maxFitnessFormatter(lastFitnessMaxValue)}`}</p>
      )}
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
      <RunTimes />
      {/* TODO genus graph.... */}
    </CollapsibleSection>
  );
}
