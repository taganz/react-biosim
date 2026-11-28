"use client";

import { useCallback } from "react";
import {
  PopulationSample,
  SingleGeneration,
  populationSampleInterval,
} from "@/simulation/world/stats/GenerationRegistry";
import LinearGraph, { GraphSeries } from "@/components/global/graphs/LinearGraph";
import RunTimes from "./RunTimes";
import useWorldValue from "@/hooks/useWorldValue";
import CollapsibleSection from "../CollapsibleSection";

const NO_GENERATIONS: SingleGeneration[] = [];
const NO_SAMPLES: PopulationSample[] = [];

function getter(data: SingleGeneration): [number, number] {
  return [data.generation, data.maxFitnessValue];
}

const PLANT_COLOR = "green";
const ANIMAL_COLOR = "red";

// continuous runs with metabolism: plants and animals every few steps
const sampleSeries: GraphSeries[] = [
  { getter: (sample: PopulationSample) => [sample.step, sample.plants], color: PLANT_COLOR },
  { getter: (sample: PopulationSample) => [sample.step, sample.animals], color: ANIMAL_COLOR },
];

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
  const showsSamples = useWorldValue(
    (world) => world.generations.isContinuous && world.generations.metabolismEnabled,
    false
  );
  // samples are pushed into the same array, so use their number to trigger graph redraws
  const samples = useWorldValue((world) => world.generationRegistry.populationSamples, NO_SAMPLES);
  const sampleCount = useWorldValue((world) => world.generationRegistry.populationSamples.length, 0);
  const sampleInterval = useWorldValue(
    (world) => populationSampleInterval(world.generations.maxAge, world.stepsPerGen),
    1
  );
  const stepsPerGen = useWorldValue((world) => world.stepsPerGen, 1);
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

  const countFormatter = useCallback((value: number) => Math.round(value).toString(), []);

  const stepFormatter = useCallback(
    (value: number) => {
      const step = Math.round(value);
      return `Step ${step} (generation #${Math.floor((step - 1) / stepsPerGen) + 1})`;
    },
    [stepsPerGen]
  );

  const lastSample = sampleCount > 0 ? samples[sampleCount - 1] : undefined;

  return (
    <CollapsibleSection title={fitnessValueName}>
      {showsSamples ? (
        <>
          <p>
            {lastSample
              ? <>
                  {"At step " + lastSample.step + ": "}
                  <span style={{ color: PLANT_COLOR }}>{lastSample.plants} plants</span>{", "}
                  <span style={{ color: ANIMAL_COLOR }}>{lastSample.animals} animals</span>
                  {`. Counted every ${sampleInterval} steps.`}
                </>
              : `Plants and animals are counted every ${sampleInterval} steps.`}
          </p>
          <p>{`Last generation: ${lastBirths} births and ${lastDeaths} deaths.`}</p>
        </>
      ) : isContinuous ? (
        <p>{`At the end of the last generation: ${lastFitnessMaxValue} creatures, ${lastBirths} births and ${lastDeaths} deaths during it.`}</p>
      ) : (
        <p>{`maxFitnessValue: ${maxFitnessFormatter(lastFitnessMaxValue)}`}</p>
      )}
      {showsSamples ? (
        <LinearGraph
          data={samples}
          series={sampleSeries}
          updateKey={sampleCount}
          preSmooth={false}
          xLabelFormatter={stepFormatter}
          yLabelFormatter={countFormatter}
          className="aspect-[2/1] w-full bg-white"
        />
      ) : (
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
      )}
      <RunTimes />
      {/* TODO genus graph.... */}
    </CollapsibleSection>
  );
}
