"use client";

import { useCallback, useMemo } from "react";
import { useAtom } from "jotai";
import useWorldValue from "@/hooks/useWorldValue";
import LinearGraph, { GraphMarker, GraphSeries } from "@/components/global/graphs/LinearGraph";
import { PopulationSample, RainEvent, populationSampleInterval } from "@/simulation/world/stats/GenerationRegistry";
import { showWaterAtom } from "../../store/guiControlsAtoms";
import CollapsibleSection from "../CollapsibleSection";

const NO_SAMPLES: PopulationSample[] = [];
const NO_RAINS: RainEvent[] = [];

// the colours of the chart and of the names above it
const CLOUD_COLOR = "#7a8aa0";
const CELLS_COLOR = "#2a78d6";
const PLANTS_COLOR = "green";
const ANIMALS_COLOR = "red";
// a rain, and a rain that did not happen because the cloud had too little water
const RAIN_COLOR = "rgba(42, 120, 214, 0.45)";
const NO_RAIN_COLOR = "rgba(200, 40, 40, 0.6)";

const waterSeries: GraphSeries[] = [
  { getter: (sample: PopulationSample) => [sample.step, sample.cloud!], color: CLOUD_COLOR },
  { getter: (sample: PopulationSample) => [sample.step, sample.cells!], color: CELLS_COLOR },
  { getter: (sample: PopulationSample) => [sample.step, sample.plantWater!], color: PLANTS_COLOR },
  { getter: (sample: PopulationSample) => [sample.step, sample.animalWater!], color: ANIMALS_COLOR },
];

const share = (value: number, total: number) => (total > 0 ? ` (${Math.round((value / total) * 100)}%)` : "");

export default function WorldWaterStatus() {
  const totalWater = useWorldValue((world) => world.worldWater.totalWater, 0);
  const waterInCloud = useWorldValue((world) => world.worldWater.waterInCloud, 0);
  const waterInCells = useWorldValue((world) => world.worldWater.waterInCells, 0);
  const waterInCreatures = useWorldValue((world) => world.worldWater.waterInCreatures, 0);
  const [showWater, setShowWater] = useAtom(showWaterAtom);
  // samples are pushed into the same array, so use their number to trigger graph redraws
  const samples = useWorldValue((world) => world.generationRegistry.populationSamples, NO_SAMPLES);
  const sampleCount = useWorldValue((world) => world.generationRegistry.populationSamples.length, 0);
  const stepsPerGen = useWorldValue((world) => world.stepsPerGen, 1);
  const sampleInterval = useWorldValue(
    (world) => populationSampleInterval(world.generations.maxAge, world.stepsPerGen),
    1
  );
  // samples of files saved before the water was sampled have none
  const waterSamples = useMemo(
    () => (sampleCount >= 0 ? samples.filter((sample) => sample.cloud !== undefined) : NO_SAMPLES),
    [samples, sampleCount]
  );
  // the rains of generational runs; continuous runs rain a little every step
  const rains = useWorldValue((world) => world.generationRegistry.rainEvents, NO_RAINS);
  const rainCount = useWorldValue((world) => world.generationRegistry.rainEvents.length, 0);
  const isContinuous = useWorldValue((world) => world.generations.isContinuous, false);
  const rainPerCell = useWorldValue((world) => world.worldWater.waterData.waterRainMaxPerCell, 0);
  const markers = useMemo<GraphMarker[]>(
    () => rains.slice(0, rainCount).map((rain) =>
      rain.skipped ? { x: rain.step, color: NO_RAIN_COLOR, dashed: true } : { x: rain.step, color: RAIN_COLOR }),
    [rains, rainCount]
  );
  const skipped = markers.filter((marker) => marker.dashed).length;
  // continuous runs: a mark at each sample with steps that had no rain
  const dryMarkers = useMemo<GraphMarker[]>(
    () => waterSamples.filter((sample) => (sample.noRainSteps ?? 0) > 0)
      .map((sample) => ({ x: sample.step, color: NO_RAIN_COLOR, dashed: true })),
    [waterSamples]
  );
  const dryStepsTotal = waterSamples.reduce((total, sample) => total + (sample.noRainSteps ?? 0), 0);
  const last = waterSamples.length > 0 ? waterSamples[waterSamples.length - 1] : undefined;

  const stepFormatter = useCallback(
    (value: number) => {
      const step = Math.round(value);
      return `Step ${step} (generation #${Math.floor((step - 1) / stepsPerGen) + 1})`;
    },
    [stepsPerGen]
  );
  const waterFormatter = useCallback((value: number) => Math.round(value).toString(), []);

  return (
    <CollapsibleSection title="Water">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4">
        <dt>Total water</dt>
        <dd>{totalWater.toFixed(1)}</dd>
        <dt>Water in cloud</dt>
        <dd>{waterInCloud.toFixed(1) + share(waterInCloud, totalWater)}</dd>
        <dt>Water in cells</dt>
        <dd>{waterInCells.toFixed(1) + share(waterInCells, totalWater)}</dd>
        <dt>Water in creatures</dt>
        <dd>{waterInCreatures.toFixed(1) + share(waterInCreatures, totalWater)}</dd>
      </dl>
      {last && (
        <>
          <p className="text-sm">
            {`Over time, at step ${last.step}: `}
            <span style={{ color: CLOUD_COLOR }}>cloud {Math.round(last.cloud!)}</span>{", "}
            <span style={{ color: CELLS_COLOR }}>cells {Math.round(last.cells!)}</span>{", "}
            <span style={{ color: PLANTS_COLOR }}>plants {Math.round(last.plantWater!)}</span>{", "}
            <span style={{ color: ANIMALS_COLOR }}>animals {Math.round(last.animalWater!)}</span>
            {`. Counted every ${sampleInterval} steps in runs with metabolism.`}
          </p>
          <p className="text-sm">
            {isContinuous
              ? <>
                  {`It rains a little every step, at most ${(rainPerCell / stepsPerGen).toFixed(3)} per cell`}
                  {last.rain !== undefined && `: ${Math.round(last.rain)} in the last ${sampleInterval} steps`}
                  {". "}
                  {dryStepsTotal > 0
                    ? <><span style={{ color: NO_RAIN_COLOR }}>Dashed red</span>{`: it did not rain in ${dryStepsTotal} steps, because the cloud had too little water.`}</>
                    : "So far it has rained in every step."}
                </>
              : <>
                  <span style={{ color: CELLS_COLOR }}>Vertical lines</span>
                  {`: rains, between generations (${markers.length - skipped} so far).`}
                  {skipped > 0 && <> <span style={{ color: NO_RAIN_COLOR }}>Dashed red</span>{`: ${skipped} times it did not rain, because the cloud had too little water.`}</>}
                </>}
          </p>
          <LinearGraph
            data={waterSamples}
            series={waterSeries}
            markers={isContinuous ? dryMarkers : markers}
            updateKey={waterSamples.length + rainCount}
            preSmooth={false}
            xLabelFormatter={stepFormatter}
            yLabelFormatter={waterFormatter}
            className="aspect-[2/1] w-full bg-white"
          />
        </>
      )}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showWater}
          onChange={(e) => setShowWater(e.target.checked)}
        />
        Show water in cells
      </label>
    </CollapsibleSection>
  );
}
