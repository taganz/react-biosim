"use client";

import React, { useRef, useState } from "react";
import { useClickAway } from "react-use";
import { FaSlidersH } from "react-icons/fa";
import classNames from "classnames";
import RestartButton from "../RestartButton";
import PlayPauseButton from "../PlayPauseButton";
import Button from "@/components/global/Button";
import { SpeedControls, useSpeedSync } from "./SpeedControls";
import useWorldValue from "@/hooks/useWorldValue";

export default function ControlBar() {
  useSpeedSync();

  // on narrow screens the speed controls open in a panel that floats over the page
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
    <header className="sticky top-0 z-30 bg-grey-mid/90 shadow-sm backdrop-blur-sm">
      <div className="section-container relative flex items-center gap-3 py-2 sm:gap-6">
        <h1 className="sr-only text-xl font-bold whitespace-nowrap lg:not-sr-only xl:sr-only 2xl:not-sr-only">
          Evolution Simulation
        </h1>

        <div
          className={classNames(
            "text-sm",
            (stepsPerGeneration < 100 && "min-w-[50px]") ||
              (stepsPerGeneration < 1000 && "min-w-[65px]") ||
              (stepsPerGeneration < 10000 && "min-w-[80px]")
          )}
        >
          <div className="flex gap-2">
            <span className="hidden sm:inline-block">Generation</span>
            <strong>#{currentGeneration}</strong>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="hidden sm:inline-block">Step</span>
            <strong>
              {currentStep}/{stepsPerGeneration}
            </strong>
          </div>
        </div>

        <div className="hidden text-xs sm:block">
          <strong>Survivors</strong>
          <div className="min-w-[90px]">
            {lastSurvivorCount
              ? `${lastSurvivorCount} (${(lastSurvivalRate * 100).toFixed(2)}%)`
              : "Wait..."}
          </div>
        </div>

        <SpeedControls className="hidden xl:flex xl:flex-nowrap" />

        <div className="ml-auto flex items-center gap-2">
          <div ref={speedRef} className="xl:hidden">
            <Button
              variant="dark"
              icon={<FaSlidersH />}
              aria-expanded={speedOpen}
              aria-label="Speed"
              title="Speed"
              onClick={() => setSpeedOpen(!speedOpen)}
            >
              <span className="hidden sm:inline">Speed</span>
            </Button>
            {speedOpen && (
              <SpeedControls className="absolute right-4 top-full z-40 mt-1 w-max max-w-[calc(100vw-2rem)] rounded-md bg-grey-mid p-3 shadow-lg" />
            )}
          </div>
          <RestartButton />
          <PlayPauseButton />
        </div>
      </div>
    </header>
  );
}
