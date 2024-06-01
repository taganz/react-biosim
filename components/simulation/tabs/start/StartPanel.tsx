"use client";

import React, { useEffect } from "react";
import ScenariosSelection from "./ScenarioSelection";
import LoggerStatus from "./LoggerStatus";
import WorldWaterStatus from "./WorldWaterStatus";


export default function StartPanel() {
  return (
    <div>
      <p className="mb-2 text-lg">
        This is a evolution simulator. Define a simulation scenario and observe the evolution of creatures in real-time. 
      </p>
      <div className="text-lg">
      <ScenariosSelection></ScenariosSelection>
      </div>
     <LoggerStatus/>
     <WorldWaterStatus/>
    </div>
  );
}
