"use client";

import WorldController from "@/simulation/world/WorldController";
import { useSetAtom, useAtomValue } from "jotai";
import React, { useEffect } from "react";
import {worldInitialValuesAtom, worldControllerAtom} from "../../store";

import ScenariosSelection from "./ScenarioSelection";
import WorldInitialValues from "@/simulation/world/WorldInitialValues";

export default function StartPanel() {
  const setWorld = useSetAtom(worldControllerAtom);
  const worldInitialValues = useAtomValue(worldInitialValuesAtom);
   
  
  useEffect(() => {
    let worldController = new WorldController(worldInitialValues as WorldInitialValues);
    setWorld(worldController);
    worldController.startRun();  
    console.log("WorldController instantiated");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

   

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
