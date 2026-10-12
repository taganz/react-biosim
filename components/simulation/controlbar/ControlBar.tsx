"use client";

import React, { useRef, useState } from "react";
import { useClickAway } from "react-use";
import { FaSlidersH } from "react-icons/fa";
import RestartButton from "../RestartButton";
import PlayPauseButton from "../PlayPauseButton";
import Button from "@/components/global/Button";
import { SpeedControls, useSpeedSync } from "./SpeedControls";
import useWorldValue from "@/hooks/useWorldValue";

export default function ControlBar() {
  useSpeedSync();

  // the speed controls open in a panel that floats over the page
  const [speedOpen, setSpeedOpen] = useState(false);
  const speedRef = useRef<HTMLDivElement>(null);
  useClickAway(speedRef, () => setSpeedOpen(false));

  const currentStep = useWorldValue((worldController) => worldController.currentStep, 1);
  const currentGeneration = useWorldValue((worldController) => worldController.currentGen, 0);
  const stepsPerGeneration = useWorldValue((worldController) => worldController.stepsPerGen, 0);
  const lastSurvivorCount = useWorldValue(
    (worldController) => worldController.generations.lastSurvivorsCount,
    0
  );
  const lastSurvivalRate = useWorldValue(
    (worldController) => worldController.generations.lastSurvivalRate,
    0
  );

  return (
    <header className="sticky top-0 z-30 h-(--control-bar-height) border-b border-grey-mid bg-grey-dark">
      <div className="section-container relative flex h-full items-center gap-4 sm:gap-8">
        <h1 className="hidden text-xl font-bold whitespace-nowrap md:block">
          Evolution Simulation
        </h1>

        {/* tabular numbers so the text does not jump while the counters change */}
        <p className="flex gap-4 text-sm whitespace-nowrap tabular-nums">
          <span>
            <span className="hidden sm:inline">Generation </span>
            <strong>#{currentGeneration}</strong>
          </span>
          <span>
            <span className="hidden sm:inline">Step </span>
            <strong>
              {currentStep}/{stepsPerGeneration}
            </strong>
          </span>
          <span className="hidden lg:inline">
            Survivors{" "}
            <strong>
              {lastSurvivorCount
                ? `${lastSurvivorCount} (${(lastSurvivalRate * 100).toFixed(1)}%)`
                : "-"}
            </strong>
          </span>
        </p>

        <div className="ml-auto flex items-center gap-2">
          <div ref={speedRef}>
            <Button
              icon={<FaSlidersH />}
              aria-expanded={speedOpen}
              aria-label="Speed"
              title="Speed"
              onClick={() => setSpeedOpen(!speedOpen)}
            >
              <span className="hidden sm:inline">Speed</span>
            </Button>
            {speedOpen && (
              <SpeedControls className="absolute right-4 top-full z-40 mt-2 w-max max-w-[calc(100vw-2rem)] rounded-md bg-grey-mid p-4 shadow-lg" />
            )}
          </div>
          <RestartButton compact />
          <PlayPauseButton />
        </div>
      </div>
    </header>
  );
}
