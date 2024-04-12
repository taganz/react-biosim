"use client";

import WorldController from "@/simulation/world/WorldController";
import { useSetAtom, useAtomValue } from "jotai";
import React, { useEffect } from "react";
import {worldInitialValuesAtom, worldControllerAtom} from "../../store";

import ScenariosSelection from "./ScenarioSelection";

export default function StartPanel() {

   
  


   

  return (
    <div>
      <p className="mb-2 text-lg">
        This is a simulation...:
      </p>
      <div className="text-lg">
      <ScenariosSelection></ScenariosSelection>
      </div>
    </div>
  );
}
