"use client";

import React, { useState } from "react";
import RestartButton from "../RestartButton";
import PlayPauseButton from "../PlayPauseButton";
import FooterStats from "./FooterStats";
import { FooterSpeedControls } from "./FooterSpeedControls";
import { FaChevronUp } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa";
import classNames from "classnames";
import useWorldPropertyValue from "@/hooks/useWorldPropertyValue";

export default function Footer() {
  const [extended, setExtended] = useState(false);

  const currentStep = useWorldPropertyValue((worldController) => worldController.currentStep, 0);
  const currentGeneration = useWorldPropertyValue((worldController) => worldController.currentGen, 0);
  const stepsPerGeneration = useWorldPropertyValue((worldController) => worldController.stepsPerGen, 0);

  return (
    <div className="sticky bottom-0 bg-grey-mid/80 shadow-sm backdrop-blur-sm">
      <div className="section-container flex flex-col gap-2 py-2 lg:py-5">
        <button
          className="flex-center xl:hidden"
          onClick={() => setExtended(!extended)}
        >
          {extended ? <FaChevronDown /> : <FaChevronUp />}
        </button>

        <div className="flex items-center gap-2 sm:gap-10">
          <div
            className={classNames(
              (stepsPerGeneration < 100 && "min-w-[40px]") ||
                (stepsPerGeneration < 1000 && "min-w-[55px]") ||
                (stepsPerGeneration < 10000 && "min-w-[70px]")
            )}
          >
            <div className="flex gap-2">
              <span className="hidden lg:inline-block">Generation</span>{" "}
              <strong>#{currentGeneration}</strong>
            </div>

            <div className="flex gap-2 text-sm">
              <span className="hidden grow lg:inline-block">Step</span>{" "}
              <strong>
                {currentStep}/{stepsPerGeneration}
              </strong>
            </div>
          </div>

          <FooterStats />

          <div className="ml-auto flex gap-10">
            <div className="hidden xl:block">
              <FooterSpeedControls />
            </div>

            <div className="flex flex-col items-center gap-1 sm:flex-row">
              <RestartButton />
              <PlayPauseButton />
            </div>
          </div>
        </div>

        <div className={classNames("xl:hidden", !extended && "hidden")}>
          <FooterSpeedControls />
        </div>
      </div>
    </div>
  );
}
