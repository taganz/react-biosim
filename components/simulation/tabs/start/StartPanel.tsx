"use client";

import React, { useEffect } from "react";
import ScenariosSelection from "./ScenarioSelection";
import LoggerStatus from "./LoggerStatus";


export default function StartPanel() {
  return (
    <div>
      <p className="mb-2 text-lg">
        This is a simulation...:
      </p>
      <div className="text-lg">
      <ScenariosSelection></ScenariosSelection>
      </div>
     <LoggerStatus/>
    </div>
  );
}
